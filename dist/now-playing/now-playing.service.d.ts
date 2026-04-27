import { Repository } from 'typeorm';
import { PlayHistory } from '../entities/play-history.entity';
import { SongRequest } from '../entities/song-request.entity';
import { Room } from '../entities/room.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';
export interface NowPlayingData {
    trackId: string;
    title: string;
    artist: string;
    albumArtUrl?: string;
    durationMs?: number;
    progressMs?: number;
    source?: string;
    requestId?: string;
    requesterId?: string;
}
export declare class NowPlayingService {
    private historyRepo;
    private reqRepo;
    private roomRepo;
    private redis;
    private gateway;
    constructor(historyRepo: Repository<PlayHistory>, reqRepo: Repository<SongRequest>, roomRepo: Repository<Room>, redis: RedisService, gateway: EventsGateway);
    setNowPlaying(roomId: string, data: NowPlayingData, djId: string): Promise<void>;
    getNowPlaying(roomId: string): Promise<NowPlayingData | null>;
}
