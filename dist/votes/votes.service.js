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
exports.VotesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vote_entity_1 = require("../entities/vote.entity");
const song_request_entity_1 = require("../entities/song-request.entity");
const room_entity_1 = require("../entities/room.entity");
const redis_service_1 = require("../redis/redis.service");
const events_gateway_1 = require("../gateway/events.gateway");
let VotesService = class VotesService {
    constructor(voteRepo, reqRepo, roomRepo, redis, gateway) {
        this.voteRepo = voteRepo;
        this.reqRepo = reqRepo;
        this.roomRepo = roomRepo;
        this.redis = redis;
        this.gateway = gateway;
    }
    async castVote(requestId, userId, roomId) {
        const alreadyVoted = await this.redis.sismember(`user:${userId}:votes:${roomId}`, requestId);
        if (alreadyVoted)
            throw new common_1.BadRequestException({ error: 'ALREADY_VOTED' });
        const rateKey = `user:${userId}:vote_rate:${roomId}`;
        const rateCount = await this.redis.incr(rateKey);
        if (rateCount === 1)
            await this.redis.expire(rateKey, 10);
        if (rateCount > 10)
            throw new common_1.BadRequestException({ error: 'VOTE_RATE_LIMIT' });
        const req = await this.reqRepo.findOne({ where: { id: requestId }, relations: ['room'] });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.status !== 'pending')
            throw new common_1.BadRequestException('Request is no longer active');
        if (req.room.id !== roomId)
            throw new common_1.BadRequestException('Request not in this room');
        const vote = this.voteRepo.create({
            songRequest: { id: requestId },
            user: { id: userId },
            room: { id: roomId },
        });
        await this.voteRepo.save(vote);
        req.voteCount += 1;
        const minutesSince = (Date.now() - new Date(req.requestedAt).getTime()) / 60000;
        const secondsSince = minutesSince * 60;
        const recencyBonus = Math.max(0, 60 - minutesSince * 2);
        const priorityBonus = req.priorityTag === 'must_play' ? 500 : req.priorityTag === 'fast_pass' ? 100 : 0;
        const score = req.voteCount * 10 + parseFloat(String(req.boostScore)) * 50 + recencyBonus + priorityBonus - secondsSince * 0.01;
        req.rankingScore = score;
        await this.reqRepo.save(req);
        await this.redis.sadd(`user:${userId}:votes:${roomId}`, requestId);
        await this.redis.zadd(`room:${roomId}:queue`, score, requestId);
        this.gateway.broadcastToDJ(roomId, 'vote_update', {
            requestId,
            newVoteCount: req.voteCount,
            newRankingScore: score,
        });
        const ids = await this.redis.zrevrange(`room:${roomId}:queue`, 0, 49);
        const requests = ids.length ? await this.reqRepo.find({ where: { id: (0, typeorm_2.In)(ids) }, relations: ["requester"] }) : [];
        const queueMap = new Map(requests.map(r => [r.id, r]));
        const queue = ids.map(id => queueMap.get(id)).filter(Boolean).map(r => ({
            id: r.id, title: r.title, artist: r.artist, albumArtUrl: r.albumArtUrl,
            voteCount: r.voteCount, rankingScore: r.rankingScore, priorityTag: r.priorityTag,
            requesterName: r.requester?.displayName,
        }));
        this.gateway.broadcastQueueUpdate(roomId, queue);
        return { newVoteCount: req.voteCount, newRankingScore: score };
    }
    async removeVote(requestId, userId, roomId) {
        const alreadyVoted = await this.redis.sismember(`user:${userId}:votes:${roomId}`, requestId);
        if (!alreadyVoted)
            throw new common_1.BadRequestException('You have not voted for this request');
        await this.voteRepo.delete({ songRequest: { id: requestId }, user: { id: userId } });
        const req = await this.reqRepo.findOne({ where: { id: requestId } });
        if (req && req.voteCount > 0) {
            req.voteCount -= 1;
            const score = req.voteCount * 10 + parseFloat(String(req.boostScore)) * 50;
            req.rankingScore = score;
            await this.reqRepo.save(req);
            await this.redis.zadd(`room:${roomId}:queue`, score, requestId);
        }
        await this.redis.srem(`user:${userId}:votes:${roomId}`, requestId);
    }
};
exports.VotesService = VotesService;
exports.VotesService = VotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vote_entity_1.Vote)),
    __param(1, (0, typeorm_1.InjectRepository)(song_request_entity_1.SongRequest)),
    __param(2, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService,
        events_gateway_1.EventsGateway])
], VotesService);
//# sourceMappingURL=votes.service.js.map