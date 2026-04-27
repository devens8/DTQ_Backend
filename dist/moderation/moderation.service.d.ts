import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { EventsGateway } from '../gateway/events.gateway';
export declare class ModerationService {
    private userRepo;
    private gateway;
    constructor(userRepo: Repository<User>, gateway: EventsGateway);
    checkContentFilter(title: string, artist: string, explicit: boolean, settings: any): boolean;
    banUserFromRoom(roomId: string, targetUserId: string, djId: string, reason: string): Promise<void>;
}
