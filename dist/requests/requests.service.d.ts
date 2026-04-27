import { Repository } from 'typeorm';
import { SongRequest } from '../entities/song-request.entity';
import { Vote } from '../entities/vote.entity';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';
import { MusicService } from '../music/music.service';
export declare class RequestsService {
    private reqRepo;
    private voteRepo;
    private userRepo;
    private roomRepo;
    private redis;
    private gateway;
    private music;
    constructor(reqRepo: Repository<SongRequest>, voteRepo: Repository<Vote>, userRepo: Repository<User>, roomRepo: Repository<Room>, redis: RedisService, gateway: EventsGateway, music: MusicService);
    computeRankingScore(req: Partial<SongRequest>): number;
    submitRequest(roomId: string, userId: string, trackId: string, source?: string): Promise<SongRequest>;
    getQueue(roomId: string, userId?: string): Promise<any[]>;
    acceptRequest(requestId: string, djId: string): Promise<SongRequest>;
    rejectRequest(requestId: string, djId: string, reason?: string): Promise<void>;
    withdrawRequest(requestId: string, userId: string): Promise<void>;
    expireOldRequests(): Promise<void>;
    recomputeAllRoomScores(): Promise<void>;
    private decrementUserActiveRequests;
    private broadcastQueueUpdate;
}
