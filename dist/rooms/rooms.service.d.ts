import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { SongRequest } from '../entities/song-request.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';
export declare class RoomsService {
    private roomRepo;
    private userRepo;
    private reqRepo;
    private redis;
    private gateway;
    constructor(roomRepo: Repository<Room>, userRepo: Repository<User>, reqRepo: Repository<SongRequest>, redis: RedisService, gateway: EventsGateway);
    createRoom(djId: string, data: {
        name?: string;
        venueId?: string;
        settings?: any;
    }): Promise<Room>;
    findByCode(code: string): Promise<Room>;
    findById(id: string): Promise<Room>;
    getRoomState(code: string, userId?: string): Promise<any>;
    setMode(roomId: string, mode: string, djId: string): Promise<Room>;
    closeRoom(roomId: string, djId: string): Promise<void>;
    getActiveParticipantCount(roomId: string): Promise<number>;
}
