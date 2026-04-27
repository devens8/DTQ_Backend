import { NowPlayingService } from './now-playing.service';
declare class SetNowPlayingDto {
    trackId: string;
    title: string;
    artist: string;
    albumArtUrl?: string;
    durationMs?: number;
    requestId?: string;
    requesterId?: string;
}
export declare class NowPlayingController {
    private readonly nowPlaying;
    constructor(nowPlaying: NowPlayingService);
    set(roomId: string, dto: SetNowPlayingDto, req: any): Promise<void>;
    get(roomId: string): Promise<import("./now-playing.service").NowPlayingData>;
}
export {};
