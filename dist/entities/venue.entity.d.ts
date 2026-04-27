import { User } from './user.entity';
import { Room } from './room.entity';
export declare class Venue {
    id: string;
    name: string;
    slug: string;
    subscriptionTier: string;
    settings: Record<string, any>;
    createdAt: Date;
    owner: User;
    rooms: Room[];
}
