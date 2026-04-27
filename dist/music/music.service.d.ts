export interface TrackResult {
    trackId: string;
    source: string;
    title: string;
    artist: string;
    albumArtUrl: string;
    durationMs: number;
    explicit: boolean;
    previewUrl: string | null;
}
export declare class MusicService {
    searchTracks(query: string, limit?: number): TrackResult[];
    getTrack(trackId: string): TrackResult | null;
}
