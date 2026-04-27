import { Repository } from 'typeorm';
import { PlayHistory } from '../entities/play-history.entity';
import { SongRequest } from '../entities/song-request.entity';
export declare class AnalyticsService {
    private historyRepo;
    private reqRepo;
    constructor(historyRepo: Repository<PlayHistory>, reqRepo: Repository<SongRequest>);
    getRoomSummary(roomId: string): Promise<{
        totalRequests: number;
        acceptedRequests: number;
        playedRequests: number;
        acceptanceRate: number;
        topRequested: {
            title: string;
            artist: string;
            voteCount: number;
            status: string;
        }[];
        playHistory: {
            title: string;
            artist: string;
            playedAt: Date;
            source: string;
            totalVotes: number;
        }[];
    }>;
}
