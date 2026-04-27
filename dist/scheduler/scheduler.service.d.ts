import { RequestsService } from '../requests/requests.service';
export declare class SchedulerService {
    private readonly requests;
    private readonly logger;
    constructor(requests: RequestsService);
    recomputeRankings(): Promise<void>;
    expireRequests(): Promise<void>;
}
