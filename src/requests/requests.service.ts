import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SongRequest } from '../entities/song-request.entity';
import { Vote } from '../entities/vote.entity';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';
import { MusicService } from '../music/music.service';

const MAX_ACTIVE_REQUESTS = 3;
const COOLDOWN_SECONDS = 60;
const MAX_QUEUE_SIZE = 200;
const REQUEST_EXPIRY_HOURS = 2;
const MAX_BOOST_ORGANIC_RATIO = 3;

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(SongRequest) private reqRepo: Repository<SongRequest>,
    @InjectRepository(Vote) private voteRepo: Repository<Vote>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    private redis: RedisService,
    private gateway: EventsGateway,
    private music: MusicService,
  ) {}

  computeRankingScore(req: Partial<SongRequest>): number {
    const minutesSince = (Date.now() - new Date(req.requestedAt || Date.now()).getTime()) / 60000;
    const secondsSince = minutesSince * 60;
    const recencyBonus = Math.max(0, 60 - minutesSince * 2);
    const priorityBonus = req.priorityTag === 'must_play' ? 500 : req.priorityTag === 'fast_pass' ? 100 : 0;

    return (
      (req.voteCount || 1) * 10 +
      (parseFloat(String(req.boostScore || 0)) * 50) +
      recencyBonus +
      priorityBonus -
      secondsSince * 0.01
    );
  }

  async submitRequest(roomId: string, userId: string, trackId: string, source = 'spotify'): Promise<SongRequest> {
    const room = await this.roomRepo.findOne({ where: { id: roomId }, relations: ['dj'] });
    if (!room) throw new NotFoundException('Room not found');
    if (room.status !== 'active') throw new BadRequestException('Room is not active');
    if (room.mode === 'override') throw new BadRequestException('DJ has paused requests');

    // Check cooldown
    const cooldownKey = `user:${userId}:cooldown:${roomId}`;
    const inCooldown = await this.redis.exists(cooldownKey);
    if (inCooldown) {
      const ttl = await this.redis.ttl(cooldownKey);
      throw new BadRequestException({ error: 'COOLDOWN_ACTIVE', cooldownEndsAt: new Date(Date.now() + ttl * 1000).toISOString() });
    }

    // Check active request limit
    const activeKey = `user:${userId}:active_requests:${roomId}`;
    const activeCountStr = await this.redis.get(activeKey);
    const activeCount = parseInt(activeCountStr || '0');
    if (activeCount >= MAX_ACTIVE_REQUESTS) {
      throw new BadRequestException({ error: 'REQUEST_LIMIT_REACHED', activeRequestCount: activeCount, maxActiveRequests: MAX_ACTIVE_REQUESTS });
    }

    // Duplicate detection
    const existing = await this.reqRepo.findOne({
      where: { room: { id: roomId }, trackId, status: 'pending' },
      relations: ['room'],
    });
    if (existing) {
      // Check if user already voted
      const alreadyVoted = await this.redis.sismember(`user:${userId}:votes:${roomId}`, existing.id);
      if (!alreadyVoted) {
        existing.voteCount += 1;
        await this.voteRepo.save(this.voteRepo.create({ songRequest: existing, user: { id: userId } as User, room: { id: roomId } as Room }));
        await this.redis.sadd(`user:${userId}:votes:${roomId}`, existing.id);
        const score = this.computeRankingScore(existing);
        existing.rankingScore = score;
        await this.reqRepo.save(existing);
        await this.redis.zadd(`room:${roomId}:queue`, score, existing.id);
        await this.broadcastQueueUpdate(roomId);
      }
      return existing;
    }

    // Queue size limit
    const queueSize = await this.redis.zcard(`room:${roomId}:queue`);
    if (queueSize >= MAX_QUEUE_SIZE) {
      throw new BadRequestException('Request queue is full');
    }

    // Fetch track metadata
    const track = this.music.getTrack(trackId);
    if (!track) throw new NotFoundException('Track not found');

    // Content filter
    if (track.explicit && room.settings?.explicitBlocked) {
      throw new BadRequestException('Explicit content is not allowed in this room');
    }

    const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_HOURS * 3600000);
    const req = this.reqRepo.create({
      room: { id: roomId } as Room,
      requester: { id: userId } as User,
      trackId,
      trackSource: source,
      title: track.title,
      artist: track.artist,
      albumArtUrl: track.albumArtUrl,
      durationMs: track.durationMs,
      explicit: track.explicit,
      voteCount: 1,
      boostScore: 0,
      status: 'pending',
      expiresAt,
      requestedAt: new Date(),
    });

    const saved = await this.reqRepo.save(req);
    const score = this.computeRankingScore(saved);
    saved.rankingScore = score;
    await this.reqRepo.save(saved);

    // Redis updates
    await this.redis.zadd(`room:${roomId}:queue`, score, saved.id);
    await this.redis.sadd(`user:${userId}:votes:${roomId}`, saved.id);
    await this.redis.incr(activeKey);
    await this.redis.expire(activeKey, REQUEST_EXPIRY_HOURS * 3600);
    await this.redis.set(cooldownKey, '1', COOLDOWN_SECONDS);

    // Update user stats
    await this.userRepo.increment({ id: userId }, 'totalRequests', 1);

    // Notify DJ and broadcast
    const requester = await this.userRepo.findOne({ where: { id: userId } });
    const fullRequest = { ...saved, requesterName: requester?.displayName, userHasVoted: true };
    this.gateway.broadcastToDJ(roomId, 'new_request', fullRequest);
    await this.broadcastQueueUpdate(roomId);

    return saved;
  }

  async getQueue(roomId: string, userId?: string): Promise<any[]> {
    // Try Redis first for sorted order; fall back to DB query
    const redisIds = await this.redis.zrevrange(`room:${roomId}:queue`, 0, 49);

    let requests: SongRequest[];
    if (redisIds.length > 0) {
      requests = await this.reqRepo.find({ where: { id: In(redisIds) }, relations: ['requester'] });
    } else {
      requests = await this.reqRepo.find({
        where: { room: { id: roomId }, status: 'pending' },
        relations: ['requester'],
        order: { rankingScore: 'DESC', requestedAt: 'ASC' },
        take: 50,
      });
    }

    if (!requests.length) return [];

    const userVotes = userId
      ? await this.redis.smembers(`user:${userId}:votes:${roomId}`)
      : [];
    const voteSet = new Set(userVotes);

    const orderedRequests = redisIds.length > 0
      ? redisIds.map(id => requests.find(r => r.id === id)).filter(Boolean) as SongRequest[]
      : requests;

    return orderedRequests.map(req => ({
      id: req.id,
      trackId: req.trackId,
      title: req.title,
      artist: req.artist,
      albumArtUrl: req.albumArtUrl,
      durationMs: req.durationMs,
      bpm: req.bpm,
      genre: req.genre,
      explicit: req.explicit,
      voteCount: req.voteCount,
      boostScore: req.boostScore,
      status: req.status,
      priorityTag: req.priorityTag,
      rankingScore: req.rankingScore,
      requesterName: req.requester?.displayName,
      requestedAt: req.requestedAt,
      userHasVoted: voteSet.has(req.id),
    }));
  }

  async acceptRequest(requestId: string, djId: string): Promise<SongRequest> {
    const req = await this.reqRepo.findOne({ where: { id: requestId }, relations: ['room', 'room.dj', 'requester'] });
    if (!req) throw new NotFoundException('Request not found');
    if (req.room.dj?.id !== djId) throw new ForbiddenException('Not your room');
    if (req.status !== 'pending') throw new BadRequestException('Request is not pending');

    req.status = 'accepted';
    req.acceptedAt = new Date();
    await this.reqRepo.save(req);

    // Remove from Redis queue
    await this.redis.zrem(`room:${req.room.id}:queue`, requestId);
    await this.decrementUserActiveRequests(req.requester.id, req.room.id);

    // Update user stats
    await this.userRepo.increment({ id: req.requester.id }, 'totalAccepts', 1);

    // Check and award badges
    const user = await this.userRepo.findOne({ where: { id: req.requester.id } });
    if (user) {
      if (user.totalAccepts === 1 && !user.badges.includes('taste_maker')) {
        user.badges = [...user.badges, 'taste_maker'];
        await this.userRepo.save(user);
      }
      if (user.totalAccepts >= 3 && !user.badges.includes('crowd_favorite')) {
        user.badges = [...user.badges, 'crowd_favorite'];
        await this.userRepo.save(user);
      }
    }

    // Notify requester
    this.gateway.notifyUser(req.requester.id, 'your_song_playing', {
      requestId,
      title: req.title,
      artist: req.artist,
    });

    // Broadcast to room
    this.gateway.broadcastToRoom(req.room.id, 'request_accepted', {
      requestId,
      title: req.title,
      artist: req.artist,
      requesterName: req.requester.displayName,
    });

    await this.broadcastQueueUpdate(req.room.id);
    return req;
  }

  async rejectRequest(requestId: string, djId: string, reason?: string): Promise<void> {
    const req = await this.reqRepo.findOne({ where: { id: requestId }, relations: ['room', 'room.dj', 'requester'] });
    if (!req) throw new NotFoundException('Request not found');
    if (req.room.dj?.id !== djId) throw new ForbiddenException('Not your room');

    req.status = 'rejected';
    await this.reqRepo.save(req);

    await this.redis.zrem(`room:${req.room.id}:queue`, requestId);
    await this.decrementUserActiveRequests(req.requester.id, req.room.id);

    this.gateway.broadcastToRoom(req.room.id, 'request_rejected', { requestId, reason: reason || null });
    await this.broadcastQueueUpdate(req.room.id);
  }

  async withdrawRequest(requestId: string, userId: string): Promise<void> {
    const req = await this.reqRepo.findOne({ where: { id: requestId }, relations: ['room', 'requester'] });
    if (!req) throw new NotFoundException('Request not found');
    if (req.requester.id !== userId) throw new ForbiddenException('Not your request');
    if (req.status !== 'pending') throw new BadRequestException('Cannot withdraw non-pending request');

    req.status = 'rejected';
    await this.reqRepo.save(req);
    await this.redis.zrem(`room:${req.room.id}:queue`, requestId);
    await this.decrementUserActiveRequests(userId, req.room.id);
    await this.broadcastQueueUpdate(req.room.id);
  }

  async expireOldRequests(): Promise<void> {
    const cutoff = new Date(Date.now() - REQUEST_EXPIRY_HOURS * 3600000);
    const expired = await this.reqRepo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'pending' })
      .andWhere('r.requestedAt < :cutoff', { cutoff })
      .leftJoinAndSelect('r.room', 'room')
      .getMany();

    for (const req of expired) {
      req.status = 'expired';
      await this.reqRepo.save(req);
      await this.redis.zrem(`room:${req.room.id}:queue`, req.id);
    }
  }

  async recomputeAllRoomScores(): Promise<void> {
    const activeRoomKeys = await this.redis.keys('room:*:queue');
    for (const key of activeRoomKeys) {
      const roomId = key.split(':')[1];
      const ids = await this.redis.zrevrange(key, 0, -1);
      for (const id of ids) {
        const req = await this.reqRepo.findOne({ where: { id } });
        if (req && req.status === 'pending') {
          const score = this.computeRankingScore(req);
          req.rankingScore = score;
          await this.reqRepo.save(req);
          await this.redis.zadd(key, score, id);
        }
      }
      await this.broadcastQueueUpdate(roomId);
    }
  }

  private async decrementUserActiveRequests(userId: string, roomId: string): Promise<void> {
    const key = `user:${userId}:active_requests:${roomId}`;
    const current = parseInt((await this.redis.get(key)) || '0');
    if (current > 0) {
      await this.redis.set(key, String(current - 1));
    }
  }

  private async broadcastQueueUpdate(roomId: string): Promise<void> {
    const queue = await this.getQueue(roomId);
    this.gateway.broadcastQueueUpdate(roomId, queue);
  }
}
