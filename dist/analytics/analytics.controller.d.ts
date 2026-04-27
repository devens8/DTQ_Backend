import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    summary(roomId: string): Promise<{
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
