import { Room } from './room.entity';
import { User } from './user.entity';
export declare class MixSuggestion {
    id: string;
    fromTrackId: string;
    fromTitle: string;
    toTrackId: string;
    toTitle: string;
    voteCount: number;
    status: string;
    suggestedAt: Date;
    room: Room;
    suggester: User;
}
