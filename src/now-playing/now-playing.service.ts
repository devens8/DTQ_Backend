import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayHistory } from '../entities/play-history.entity';
import { SongRequest } from '../entities/song-request.entity';
import { Room } from '../entities/room.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';

export interface NowPlayingData {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl?: string;
  durationMs?: number;
  progressMs?: number;
  source?: string;
  requestId?: string;
  requesterId?: string;
}

@Injectable()
export class NowPlayingService {
  constructor(
    @InjectRepository(PlayHistory) private historyRepo: Repository<PlayHistory>,
    @InjectRepository(SongRequest) private reqRepo: Repository<SongRequest>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    private redis: RedisService,
    private gateway: EventsGateway,
  ) {}

  async setNowPlaying(roomId: string, data: NowPlayingData, djId: string): Promise<void> {
    const room = await this.roomRepo.findOne({ where: { id: roomId }, relations: ['dj'] });
    if (!room) throw new NotFoundException('Room not found');
    if (room.dj?.id !== djId) throw new ForbiddenException('Not your room');

    // Store in Redis
    await this.redis.hmset(`room:${roomId}:now_playing`, {
      trackId: data.trackId,
      title: data.title,
      artist: data.artist,
      albumArtUrl: data.albumArtUrl || '',
      durationMs: String(data.durationMs || 0),
      progressMs: String(data.progressMs || 0),
      startedAt: String(Date.now()),
    });

    // Save play history
    const history = this.historyRepo.create({
      room: { id: roomId } as Room,
      trackId: data.trackId,
      title: data.title,
      artist: data.artist,
      source: data.requestId ? 'accepted_request' : 'dj',
      totalVotes: 0,
    });

    if (data.requestId) {
      const req = await this.reqRepo.findOne({ where: { id: data.requestId } });
      if (req) {
        history.songRequest = req;
        history.totalVotes = req.voteCount;
        req.status = 'played';
        req.playedAt = new Date();
        await this.reqRepo.save(req);
      }
    }

    await this.historyRepo.save(history);

    // Broadcast to all attendees
    this.gateway.broadcastNowPlaying(roomId, {
      trackId: data.trackId,
      title: data.title,
      artist: data.artist,
      albumArtUrl: data.albumArtUrl,
      durationMs: data.durationMs,
      progressMs: 0,
    });

    // Notify requester
    if (data.requesterId) {
      this.gateway.notifyUser(data.requesterId, 'your_song_playing', {
        title: data.title,
        artist: data.artist,
      });
    }
  }

  async getNowPlaying(roomId: string): Promise<NowPlayingData | null> {
    const raw = await this.redis.hgetall(`room:${roomId}:now_playing`);
    if (!raw) return null;

    const startedAt = parseInt(raw.startedAt || '0');
    const progressMs = startedAt ? Date.now() - startedAt : 0;

    return {
      trackId: raw.trackId,
      title: raw.title,
      artist: raw.artist,
      albumArtUrl: raw.albumArtUrl,
      durationMs: parseInt(raw.durationMs || '0'),
      progressMs: Math.min(progressMs, parseInt(raw.durationMs || '0')),
    };
  }
}
