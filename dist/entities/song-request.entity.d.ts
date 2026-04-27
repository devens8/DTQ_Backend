import { Room } from './room.entity';
import { User } from './user.entity';
import { Vote } from './vote.entity';
export declare class SongRequest {
    id: string;
    trackId: string;
    trackSource: string;
    title: string;
    artist: string;
    albumArtUrl: string;
    durationMs: number;
    bpm: number;
    genre: string;
    explicit: boolean;
    voteCount: number;
    boostScore: number;
    status: string;
    priorityTag: string;
    rankingScore: number;
    requestedAt: Date;
    acceptedAt: Date;
    playedAt: Date;
    expiresAt: Date;
    room: Room;
    requester: User;
    votes: Vote[];
}
