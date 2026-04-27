import { RequestsService } from './requests.service';
declare class SubmitRequestDto {
    trackId: string;
    source?: string;
}
declare class RejectDto {
    reason?: string;
}
export declare class RequestsController {
    private readonly requests;
    constructor(requests: RequestsService);
    submit(roomId: string, dto: SubmitRequestDto, req: any): Promise<import("../entities/song-request.entity").SongRequest>;
    getQueue(roomId: string, req: any): Promise<any[]>;
    withdraw(roomId: string, reqId: string, req: any): Promise<void>;
    accept(roomId: string, reqId: string, req: any): Promise<import("../entities/song-request.entity").SongRequest>;
    reject(roomId: string, reqId: string, dto: RejectDto, req: any): Promise<void>;
}
export {};
