import { Room } from './room.entity';
import { SongRequest } from './song-request.entity';
export declare class PlayHistory {
    id: string;
    trackId: string;
    title: string;
    artist: string;
    source: string;
    totalVotes: number;
    playedAt: Date;
    room: Room;
    songRequest: SongRequest;
}
