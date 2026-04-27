import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
export declare class SeedService implements OnApplicationBootstrap {
    private userRepo;
    private roomRepo;
    private readonly logger;
    constructor(userRepo: Repository<User>, roomRepo: Repository<Room>);
    onApplicationBootstrap(): Promise<void>;
    private seedDJs;
    private seedRooms;
}
