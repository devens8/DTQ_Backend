import { Repository } from 'typeorm';
import { Vote } from '../entities/vote.entity';
import { SongRequest } from '../entities/song-request.entity';
import { Room } from '../entities/room.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';
export declare class VotesService {
    private voteRepo;
    private reqRepo;
    private roomRepo;
    private redis;
    private gateway;
    constructor(voteRepo: Repository<Vote>, reqRepo: Repository<SongRequest>, roomRepo: Repository<Room>, redis: RedisService, gateway: EventsGateway);
    castVote(requestId: string, userId: string, roomId: string): Promise<{
        newVoteCount: number;
        newRankingScore: number;
    }>;
    removeVote(requestId: string, userId: string, roomId: string): Promise<void>;
}
