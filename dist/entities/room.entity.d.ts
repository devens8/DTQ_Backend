import { Venue } from './venue.entity';
import { User } from './user.entity';
import { SongRequest } from './song-request.entity';
export declare class Room {
    id: string;
    code: string;
    qrToken: string;
    name: string;
    status: string;
    mode: string;
    playlistSource: string;
    settings: Record<string, any>;
    startedAt: Date;
    closedAt: Date;
    venue: Venue;
    dj: User;
    requests: SongRequest[];
}
