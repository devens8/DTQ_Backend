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
exports.NowPlayingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const play_history_entity_1 = require("../entities/play-history.entity");
const song_request_entity_1 = require("../entities/song-request.entity");
const room_entity_1 = require("../entities/room.entity");
const redis_service_1 = require("../redis/redis.service");
const events_gateway_1 = require("../gateway/events.gateway");
let NowPlayingService = class NowPlayingService {
    constructor(historyRepo, reqRepo, roomRepo, redis, gateway) {
        this.historyRepo = historyRepo;
        this.reqRepo = reqRepo;
        this.roomRepo = roomRepo;
        this.redis = redis;
        this.gateway = gateway;
    }
    async setNowPlaying(roomId, data, djId) {
        const room = await this.roomRepo.findOne({ where: { id: roomId }, relations: ['dj'] });
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        if (room.dj?.id !== djId)
            throw new common_1.ForbiddenException('Not your room');
        await this.redis.hmset(`room:${roomId}:now_playing`, {
            trackId: data.trackId,
            title: data.title,
            artist: data.artist,
            albumArtUrl: data.albumArtUrl || '',
            durationMs: String(data.durationMs || 0),
            progressMs: String(data.progressMs || 0),
            startedAt: String(Date.now()),
        });
        const history = this.historyRepo.create({
            room: { id: roomId },
            trackId: data.trackId,
            title: data.title,
            artist: data.artist,
            source: data.requestId ? 'accepted_request' : 'dj',
            totalVotes: 0,
        });
        if (data.requestId) {
            const req = await this.reqRepo.findOne({ where: { id: data.requestId } });
            if (req) {
                history.songRequest = req;
                history.totalVotes = req.voteCount;
                req.status = 'played';
                req.playedAt = new Date();
                await this.reqRepo.save(req);
            }
        }
        await this.historyRepo.save(history);
        this.gateway.broadcastNowPlaying(roomId, {
            trackId: data.trackId,
            title: data.title,
            artist: data.artist,
            albumArtUrl: data.albumArtUrl,
            durationMs: data.durationMs,
            progressMs: 0,
        });
        if (data.requesterId) {
            this.gateway.notifyUser(data.requesterId, 'your_song_playing', {
                title: data.title,
                artist: data.artist,
            });
        }
    }
    async getNowPlaying(roomId) {
        const raw = await this.redis.hgetall(`room:${roomId}:now_playing`);
        if (!raw)
            return null;
        const startedAt = parseInt(raw.startedAt || '0');
        const progressMs = startedAt ? Date.now() - startedAt : 0;
        return {
            trackId: raw.trackId,
            title: raw.title,
            artist: raw.artist,
            albumArtUrl: raw.albumArtUrl,
            durationMs: parseInt(raw.durationMs || '0'),
            progressMs: Math.min(progressMs, parseInt(raw.durationMs || '0')),
        };
    }
};
exports.NowPlayingService = NowPlayingService;
exports.NowPlayingService = NowPlayingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(play_history_entity_1.PlayHistory)),
    __param(1, (0, typeorm_1.InjectRepository)(song_request_entity_1.SongRequest)),
    __param(2, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService,
        events_gateway_1.EventsGateway])
], NowPlayingService);
//# sourceMappingURL=now-playing.service.js.map