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
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const room_entity_1 = require("../entities/room.entity");
const user_entity_1 = require("../entities/user.entity");
const song_request_entity_1 = require("../entities/song-request.entity");
const redis_service_1 = require("../redis/redis.service");
const events_gateway_1 = require("../gateway/events.gateway");
const uuid_1 = require("uuid");
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
let RoomsService = class RoomsService {
    constructor(roomRepo, userRepo, reqRepo, redis, gateway) {
        this.roomRepo = roomRepo;
        this.userRepo = userRepo;
        this.reqRepo = reqRepo;
        this.redis = redis;
        this.gateway = gateway;
    }
    async createRoom(djId, data) {
        let code;
        let attempts = 0;
        do {
            code = generateRoomCode();
            attempts++;
            if (attempts > 20)
                throw new Error('Could not generate unique room code');
        } while (await this.roomRepo.findOne({ where: { code, status: 'active' } }));
        const dj = await this.userRepo.findOne({ where: { id: djId } });
        const room = this.roomRepo.create({
            code,
            qrToken: (0, uuid_1.v4)(),
            name: data.name || `Room ${code}`,
            status: 'active',
            mode: 'normal',
            settings: data.settings || {},
            dj,
        });
        return this.roomRepo.save(room);
    }
    async findByCode(code) {
        const room = await this.roomRepo.findOne({
            where: { code: code.toUpperCase(), status: 'active' },
            relations: ['dj'],
        });
        if (!room)
            throw new common_1.NotFoundException('Room not found or no longer active');
        return room;
    }
    async findById(id) {
        const room = await this.roomRepo.findOne({ where: { id }, relations: ['dj'] });
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        return room;
    }
    async getRoomState(code, userId) {
        const room = await this.findByCode(code);
        const nowPlayingRaw = await this.redis.hgetall(`room:${room.id}:now_playing`);
        const nowPlaying = nowPlayingRaw
            ? {
                trackId: nowPlayingRaw.trackId,
                title: nowPlayingRaw.title,
                artist: nowPlayingRaw.artist,
                albumArtUrl: nowPlayingRaw.albumArtUrl,
                durationMs: parseInt(nowPlayingRaw.durationMs || '0'),
                progressMs: parseInt(nowPlayingRaw.progressMs || '0'),
            }
            : null;
        const redisIds = await this.redis.zrevrange(`room:${room.id}:queue`, 0, 49);
        let queueRequests;
        if (redisIds.length > 0) {
            queueRequests = await this.reqRepo.find({ where: { id: (0, typeorm_2.In)(redisIds) }, relations: ['requester'] });
            queueRequests.sort((a, b) => redisIds.indexOf(a.id) - redisIds.indexOf(b.id));
        }
        else {
            queueRequests = await this.reqRepo.find({
                where: { room: { id: room.id }, status: 'pending' },
                relations: ['requester'],
                order: { rankingScore: 'DESC', requestedAt: 'ASC' },
                take: 50,
            });
        }
        const userVotes = userId ? await this.redis.smembers(`user:${userId}:votes:${room.id}`) : [];
        const voteSet = new Set(userVotes);
        const queue = queueRequests.map(req => ({
            id: req.id,
            trackId: req.trackId,
            title: req.title,
            artist: req.artist,
            albumArtUrl: req.albumArtUrl,
            durationMs: req.durationMs,
            bpm: req.bpm,
            genre: req.genre,
            explicit: req.explicit,
            voteCount: req.voteCount,
            boostScore: req.boostScore,
            status: req.status,
            priorityTag: req.priorityTag,
            rankingScore: req.rankingScore,
            requesterName: req.requester?.displayName,
            requestedAt: req.requestedAt,
            userHasVoted: voteSet.has(req.id),
        }));
        let userState = { activeRequests: 0, cooldownEndsAt: null, canVote: true };
        if (userId) {
            const activeCount = await this.redis.get(`user:${userId}:active_requests:${room.id}`);
            const cooldownTtl = await this.redis.ttl(`user:${userId}:cooldown:${room.id}`);
            userState = {
                activeRequests: parseInt(activeCount || '0'),
                cooldownEndsAt: cooldownTtl > 0 ? new Date(Date.now() + cooldownTtl * 1000).toISOString() : null,
                canVote: true,
            };
        }
        return {
            room: {
                id: room.id,
                name: room.name,
                code: room.code,
                status: room.status,
                mode: room.mode,
                dj: room.dj ? { id: room.dj.id, displayName: room.dj.displayName } : null,
            },
            nowPlaying,
            queue,
            userState,
        };
    }
    async setMode(roomId, mode, djId) {
        const room = await this.findById(roomId);
        if (room.dj?.id !== djId)
            throw new common_1.ForbiddenException('Not your room');
        room.mode = mode;
        const saved = await this.roomRepo.save(room);
        this.gateway.broadcastToRoom(roomId, 'room_mode_changed', { mode });
        return saved;
    }
    async closeRoom(roomId, djId) {
        const room = await this.findById(roomId);
        if (room.dj?.id !== djId)
            throw new common_1.ForbiddenException('Not your room');
        room.status = 'closed';
        room.closedAt = new Date();
        await this.roomRepo.save(room);
        this.gateway.broadcastRoomClosed(roomId);
    }
    async getActiveParticipantCount(roomId) {
        const keys = await this.redis.keys(`presence:${roomId}:*`);
        return keys.length;
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(song_request_entity_1.SongRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService,
        events_gateway_1.EventsGateway])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map