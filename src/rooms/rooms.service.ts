import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { SongRequest } from '../entities/song-request.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';
import { v4 as uuidv4 } from 'uuid';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(SongRequest) private reqRepo: Repository<SongRequest>,
    private redis: RedisService,
    private gateway: EventsGateway,
  ) {}

  async createRoom(djId: string, data: { name?: string; venueId?: string; settings?: any }): Promise<Room> {
    let code: string;
    let attempts = 0;
    do {
      code = generateRoomCode();
      attempts++;
      if (attempts > 20) throw new Error('Could not generate unique room code');
    } while (await this.roomRepo.findOne({ where: { code, status: 'active' } }));

    const dj = await this.userRepo.findOne({ where: { id: djId } });
    const room = this.roomRepo.create({
      code,
      qrToken: uuidv4(),
      name: data.name || `Room ${code}`,
      status: 'active',
      mode: 'normal',
      settings: data.settings || {},
      dj,
    });

    return this.roomRepo.save(room);
  }

  async findByCode(code: string): Promise<Room> {
    const room = await this.roomRepo.findOne({
      where: { code: code.toUpperCase(), status: 'active' },
      relations: ['dj'],
    });
    if (!room) throw new NotFoundException('Room not found or no longer active');
    return room;
  }

  async findById(id: string): Promise<Room> {
    const room = await this.roomRepo.findOne({ where: { id }, relations: ['dj'] });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getRoomState(code: string, userId?: string): Promise<any> {
    const room = await this.findByCode(code);

    const nowPlayingRaw = await this.redis.hgetall(`room:${room.id}:now_playing`);
    const nowPlaying = nowPlayingRaw
      ? {
          trackId: nowPlayingRaw.trackId,
          title: nowPlayingRaw.title,
          artist: nowPlayingRaw.artist,
          albumArtUrl: nowPlayingRaw.albumArtUrl,
          durationMs: parseInt(nowPlayingRaw.durationMs || '0'),
          progressMs: parseInt(nowPlayingRaw.progressMs || '0'),
        }
      : null;

    // Get queue — Redis sorted order if available, else DB fallback
    const redisIds = await this.redis.zrevrange(`room:${room.id}:queue`, 0, 49);
    let queueRequests: SongRequest[];
    if (redisIds.length > 0) {
      queueRequests = await this.reqRepo.find({ where: { id: In(redisIds) }, relations: ['requester'] });
      queueRequests.sort((a, b) => redisIds.indexOf(a.id) - redisIds.indexOf(b.id));
    } else {
      queueRequests = await this.reqRepo.find({
        where: { room: { id: room.id }, status: 'pending' },
        relations: ['requester'],
        order: { rankingScore: 'DESC', requestedAt: 'ASC' },
        take: 50,
      });
    }

    const userVotes = userId ? await this.redis.smembers(`user:${userId}:votes:${room.id}`) : [];
    const voteSet = new Set(userVotes);

    const queue = queueRequests.map(req => ({
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

    let userState = { activeRequests: 0, cooldownEndsAt: null as string | null, canVote: true };
    if (userId) {
      const activeCount = await this.redis.get(`user:${userId}:active_requests:${room.id}`);
      const cooldownTtl = await this.redis.ttl(`user:${userId}:cooldown:${room.id}`);
      userState = {
        activeRequests: parseInt(activeCount || '0'),
        cooldownEndsAt: cooldownTtl > 0 ? new Date(Date.now() + cooldownTtl * 1000).toISOString() : null,
        canVote: true,
      };
    }

    return {
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        status: room.status,
        mode: room.mode,
        dj: room.dj ? { id: room.dj.id, displayName: room.dj.displayName } : null,
      },
      nowPlaying,
      queue,
      userState,
    };
  }

  async setMode(roomId: string, mode: string, djId: string): Promise<Room> {
    const room = await this.findById(roomId);
    if (room.dj?.id !== djId) throw new ForbiddenException('Not your room');
    room.mode = mode;
    const saved = await this.roomRepo.save(room);
    this.gateway.broadcastToRoom(roomId, 'room_mode_changed', { mode });
    return saved;
  }

  async closeRoom(roomId: string, djId: string): Promise<void> {
    const room = await this.findById(roomId);
    if (room.dj?.id !== djId) throw new ForbiddenException('Not your room');
    room.status = 'closed';
    room.closedAt = new Date();
    await this.roomRepo.save(room);
    this.gateway.broadcastRoomClosed(roomId);
  }

  async getActiveParticipantCount(roomId: string): Promise<number> {
    const keys = await this.redis.keys(`presence:${roomId}:*`);
    return keys.length;
  }
}
