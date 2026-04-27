import { MusicService } from './music.service';
declare class SearchQueryDto {
    q: string;
    source?: string;
    limit?: number;
}
export declare class MusicController {
    private readonly musicService;
    constructor(musicService: MusicService);
    search(query: SearchQueryDto): import("./music.service").TrackResult[];
    getTrack(id: string): import("./music.service").TrackResult;
}
export {};
