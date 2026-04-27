import { Repository } from 'typeorm';
import { MixSuggestion } from '../entities/mix-suggestion.entity';
import { EventsGateway } from '../gateway/events.gateway';
export declare class MixSuggestionsService {
    private repo;
    private gateway;
    constructor(repo: Repository<MixSuggestion>, gateway: EventsGateway);
    suggest(roomId: string, userId: string, fromTrackId: string, fromTitle: string, toTrackId: string, toTitle: string): Promise<MixSuggestion>;
    vote(suggestionId: string, userId: string): Promise<void>;
    getForRoom(roomId: string, limit?: number): Promise<MixSuggestion[]>;
}
