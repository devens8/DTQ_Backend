import { VotesService } from './votes.service';
export declare class VotesController {
    private readonly votes;
    constructor(votes: VotesService);
    cast(roomId: string, reqId: string, req: any): Promise<{
        newVoteCount: number;
        newRankingScore: number;
    }>;
    remove(roomId: string, reqId: string, req: any): Promise<void>;
}
