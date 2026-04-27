import { User } from './user.entity';
import { Room } from './room.entity';
import { SongRequest } from './song-request.entity';
export declare class Transaction {
    id: string;
    type: string;
    amountCents: number;
    currency: string;
    stripePaymentId: string;
    status: string;
    createdAt: Date;
    user: User;
    room: Room;
    songRequest: SongRequest;
}
