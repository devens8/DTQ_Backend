import { MixSuggestionsService } from './mix-suggestions.service';
declare class SuggestDto {
    fromTrackId: string;
    fromTitle: string;
    toTrackId: string;
    toTitle: string;
}
export declare class MixSuggestionsController {
    private readonly mixes;
    constructor(mixes: MixSuggestionsService);
    suggest(roomId: string, dto: SuggestDto, req: any): Promise<import("../entities/mix-suggestion.entity").MixSuggestion>;
    vote(id: string, req: any): Promise<void>;
    getForDJ(roomId: string): Promise<import("../entities/mix-suggestion.entity").MixSuggestion[]>;
}
export {};
