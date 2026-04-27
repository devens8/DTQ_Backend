import { SongRequest } from './song-request.entity';
import { User } from './user.entity';
import { Room } from './room.entity';
export declare class Vote {
    id: string;
    votedAt: Date;
    songRequest: SongRequest;
    user: User;
    room: Room;
}
