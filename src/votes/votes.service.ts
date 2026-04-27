import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Vote } from '../entities/vote.entity';
import { SongRequest } from '../entities/song-request.entity';
import { Room } from '../entities/room.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote) private voteRepo: Repository<Vote>,
    @InjectRepository(SongRequest) private reqRepo: Repository<SongRequest>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    private redis: RedisService,
    private gateway: EventsGateway,
  ) {}

  async castVote(requestId: string, userId: string, roomId: string): Promise<{ newVoteCount: number; newRankingScore: number }> {
    // Check Redis first (fast path)
    const alreadyVoted = await this.redis.sismember(`user:${userId}:votes:${roomId}`, requestId);
    if (alreadyVoted) throw new BadRequestException({ error: 'ALREADY_VOTED' });

    // Rate limit: max 10 votes per 10 seconds
    const rateKey = `user:${userId}:vote_rate:${roomId}`;
    const rateCount = await this.redis.incr(rateKey);
    if (rateCount === 1) await this.redis.expire(rateKey, 10);
    if (rateCount > 10) throw new BadRequestException({ error: 'VOTE_RATE_LIMIT' });

    const req = await this.reqRepo.findOne({ where: { id: requestId }, relations: ['room'] });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') throw new BadRequestException('Request is no longer active');
    if (req.room.id !== roomId) throw new BadRequestException('Request not in this room');

    // Save vote
    const vote = this.voteRepo.create({
      songRequest: { id: requestId } as SongRequest,
      user: { id: userId } as any,
      room: { id: roomId } as Room,
    });
    await this.voteRepo.save(vote);

    // Update vote count
    req.voteCount += 1;

    // Recompute score with decay
    const minutesSince = (Date.now() - new Date(req.requestedAt).getTime()) / 60000;
    const secondsSince = minutesSince * 60;
    const recencyBonus = Math.max(0, 60 - minutesSince * 2);
    const priorityBonus = req.priorityTag === 'must_play' ? 500 : req.priorityTag === 'fast_pass' ? 100 : 0;
    const score = req.voteCount * 10 + parseFloat(String(req.boostScore)) * 50 + recencyBonus + priorityBonus - secondsSince * 0.01;

    req.rankingScore = score;
    await this.reqRepo.save(req);

    // Update Redis
    await this.redis.sadd(`user:${userId}:votes:${roomId}`, requestId);
    await this.redis.zadd(`room:${roomId}:queue`, score, requestId);

    // Notify DJ
    this.gateway.broadcastToDJ(roomId, 'vote_update', {
      requestId,
      newVoteCount: req.voteCount,
      newRankingScore: score,
    });

    // Broadcast updated queue to all
    const ids = await this.redis.zrevrange(`room:${roomId}:queue`, 0, 49);
    const requests = ids.length ? await this.reqRepo.find({ where: { id: In(ids) }, relations: ["requester"] }) : [];
    const queueMap = new Map(requests.map(r => [r.id, r]));
    const queue = ids.map(id => queueMap.get(id)).filter(Boolean).map(r => ({
      id: r.id, title: r.title, artist: r.artist, albumArtUrl: r.albumArtUrl,
      voteCount: r.voteCount, rankingScore: r.rankingScore, priorityTag: r.priorityTag,
      requesterName: r.requester?.displayName,
    }));
    this.gateway.broadcastQueueUpdate(roomId, queue);

    return { newVoteCount: req.voteCount, newRankingScore: score };
  }

  async removeVote(requestId: string, userId: string, roomId: string): Promise<void> {
    const alreadyVoted = await this.redis.sismember(`user:${userId}:votes:${roomId}`, requestId);
    if (!alreadyVoted) throw new BadRequestException('You have not voted for this request');

    await this.voteRepo.delete({ songRequest: { id: requestId }, user: { id: userId } as any });

    const req = await this.reqRepo.findOne({ where: { id: requestId } });
    if (req && req.voteCount > 0) {
      req.voteCount -= 1;
      const score = req.voteCount * 10 + parseFloat(String(req.boostScore)) * 50;
      req.rankingScore = score;
      await this.reqRepo.save(req);
      await this.redis.zadd(`room:${roomId}:queue`, score, requestId);
    }

    await this.redis.srem(`user:${userId}:votes:${roomId}`, requestId);
  }
}
