"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixSuggestionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mix_suggestion_entity_1 = require("../entities/mix-suggestion.entity");
const events_gateway_1 = require("../gateway/events.gateway");
let MixSuggestionsService = class MixSuggestionsService {
    constructor(repo, gateway) {
        this.repo = repo;
        this.gateway = gateway;
    }
    async suggest(roomId, userId, fromTrackId, fromTitle, toTrackId, toTitle) {
        const suggestion = this.repo.create({
            room: { id: roomId },
            suggester: { id: userId },
            fromTrackId,
            fromTitle,
            toTrackId,
            toTitle,
            voteCount: 1,
            status: 'pending',
        });
        const saved = await this.repo.save(suggestion);
        this.gateway.broadcastToDJ(roomId, 'new_mix_suggestion', saved);
        return saved;
    }
    async vote(suggestionId, userId) {
        const suggestion = await this.repo.findOne({ where: { id: suggestionId } });
        if (!suggestion)
            throw new common_1.NotFoundException('Suggestion not found');
        suggestion.voteCount += 1;
        await this.repo.save(suggestion);
    }
    async getForRoom(roomId, limit = 10) {
        return this.repo.find({
            where: { room: { id: roomId }, status: 'pending' },
            order: { voteCount: 'DESC', suggestedAt: 'DESC' },
            take: limit,
            relations: ['suggester'],
        });
    }
};
exports.MixSuggestionsService = MixSuggestionsService;
exports.MixSuggestionsService = MixSuggestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mix_suggestion_entity_1.MixSuggestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        events_gateway_1.EventsGateway])
], MixSuggestionsService);
//# sourceMappingURL=mix-suggestions.service.js.map