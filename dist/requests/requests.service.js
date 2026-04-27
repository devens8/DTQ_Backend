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
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const song_request_entity_1 = require("../entities/song-request.entity");
const vote_entity_1 = require("../entities/vote.entity");
const user_entity_1 = require("../entities/user.entity");
const room_entity_1 = require("../entities/room.entity");
const redis_service_1 = require("../redis/redis.service");
const events_gateway_1 = require("../gateway/events.gateway");
const music_service_1 = require("../music/music.service");
const MAX_ACTIVE_REQUESTS = 3;
const COOLDOWN_SECONDS = 60;
const MAX_QUEUE_SIZE = 200;
const REQUEST_EXPIRY_HOURS = 2;
const MAX_BOOST_ORGANIC_RATIO = 3;
let RequestsService = class RequestsService {
    constructor(reqRepo, voteRepo, userRepo, roomRepo, redis, gateway, music) {
        this.reqRepo = reqRepo;
        this.voteRepo = voteRepo;
        this.userRepo = userRepo;
        this.roomRepo = roomRepo;
        this.redis = redis;
        this.gateway = gateway;
        this.music = music;
    }
    computeRankingScore(req) {
        const minutesSince = (Date.now() - new Date(req.requestedAt || Date.now()).getTime()) / 60000;
        const secondsSince = minutesSince * 60;
        const recencyBonus = Math.max(0, 60 - minutesSince * 2);
        const priorityBonus = req.priorityTag === 'must_play' ? 500 : req.priorityTag === 'fast_pass' ? 100 : 0;
        return ((req.voteCount || 1) * 10 +
            (parseFloat(String(req.boostScore || 0)) * 50) +
            recencyBonus +
            priorityBonus -
            secondsSince * 0.01);
    }
    async submitRequest(roomId, userId, trackId, source = 'spotify') {
        const room = await this.roomRepo.findOne({ where: { id: roomId }, relations: ['dj'] });
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        if (room.status !== 'active')
            throw new common_1.BadRequestException('Room is not active');
        if (room.mode === 'override')
            throw new common_1.BadRequestException('DJ has paused requests');
        const cooldownKey = `user:${userId}:cooldown:${roomId}`;
        const inCooldown = await this.redis.exists(cooldownKey);
        if (inCooldown) {
            const ttl = await this.redis.ttl(cooldownKey);
            throw new common_1.BadRequestException({ error: 'COOLDOWN_ACTIVE', cooldownEndsAt: new Date(Date.now() + ttl * 1000).toISOString() });
        }
        const activeKey = `user:${userId}:active_requests:${roomId}`;
        const activeCountStr = await this.redis.get(activeKey);
        const activeCount = parseInt(activeCountStr || '0');
        if (activeCount >= MAX_ACTIVE_REQUESTS) {
            throw new common_1.BadRequestException({ error: 'REQUEST_LIMIT_REACHED', activeRequestCount: activeCount, maxActiveRequests: MAX_ACTIVE_REQUESTS });
        }
        const existing = await this.reqRepo.findOne({
            where: { room: { id: roomId }, trackId, status: 'pending' },
            relations: ['room'],
        });
        if (existing) {
            const alreadyVoted = await this.redis.sismember(`user:${userId}:votes:${roomId}`, existing.id);
            if (!alreadyVoted) {
                existing.voteCount += 1;
                await this.voteRepo.save(this.voteRepo.create({ songRequest: existing, user: { id: userId }, room: { id: roomId } }));
                await this.redis.sadd(`user:${userId}:votes:${roomId}`, existing.id);
                const score = this.computeRankingScore(existing);
                existing.rankingScore = score;
                await this.reqRepo.save(existing);
                await this.redis.zadd(`room:${roomId}:queue`, score, existing.id);
                await this.broadcastQueueUpdate(roomId);
            }
            return existing;
        }
        const queueSize = await this.redis.zcard(`room:${roomId}:queue`);
        if (queueSize >= MAX_QUEUE_SIZE) {
            throw new common_1.BadRequestException('Request queue is full');
        }
        const track = this.music.getTrack(trackId);
        if (!track)
            throw new common_1.NotFoundException('Track not found');
        if (track.explicit && room.settings?.explicitBlocked) {
            throw new common_1.BadRequestException('Explicit content is not allowed in this room');
        }
        const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_HOURS * 3600000);
        const req = this.reqRepo.create({
            room: { id: roomId },
            requester: { id: userId },
            trackId,
            trackSource: source,
            title: track.title,
            artist: track.artist,
            albumArtUrl: track.albumArtUrl,
            durationMs: track.durationMs,
            explicit: track.explicit,
            voteCount: 1,
            boostScore: 0,
            status: 'pending',
            expiresAt,
            requestedAt: new Date(),
        });
        const saved = await this.reqRepo.save(req);
        const score = this.computeRankingScore(saved);
        saved.rankingScore = score;
        await this.reqRepo.save(saved);
        await this.redis.zadd(`room:${roomId}:queue`, score, saved.id);
        await this.redis.sadd(`user:${userId}:votes:${roomId}`, saved.id);
        await this.redis.incr(activeKey);
        await this.redis.expire(activeKey, REQUEST_EXPIRY_HOURS * 3600);
        await this.redis.set(cooldownKey, '1', COOLDOWN_SECONDS);
        await this.userRepo.increment({ id: userId }, 'totalRequests', 1);
        const requester = await this.userRepo.findOne({ where: { id: userId } });
        const fullRequest = { ...saved, requesterName: requester?.displayName, userHasVoted: true };
        this.gateway.broadcastToDJ(roomId, 'new_request', fullRequest);
        await this.broadcastQueueUpdate(roomId);
        return saved;
    }
    async getQueue(roomId, userId) {
        const redisIds = await this.redis.zrevrange(`room:${roomId}:queue`, 0, 49);
        let requests;
        if (redisIds.length > 0) {
            requests = await this.reqRepo.find({ where: { id: (0, typeorm_2.In)(redisIds) }, relations: ['requester'] });
        }
        else {
            requests = await this.reqRepo.find({
                where: { room: { id: roomId }, status: 'pending' },
                relations: ['requester'],
                order: { rankingScore: 'DESC', requestedAt: 'ASC' },
                take: 50,
            });
        }
        if (!requests.length)
            return [];
        const userVotes = userId
            ? await this.redis.smembers(`user:${userId}:votes:${roomId}`)
            : [];
        const voteSet = new Set(userVotes);
        const orderedRequests = redisIds.length > 0
            ? redisIds.map(id => requests.find(r => r.id === id)).filter(Boolean)
            : requests;
        return orderedRequests.map(req => ({
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
    }
    async acceptRequest(requestId, djId) {
        const req = await this.reqRepo.findOne({ where: { id: requestId }, relations: ['room', 'room.dj', 'requester'] });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.room.dj?.id !== djId)
            throw new common_1.ForbiddenException('Not your room');
        if (req.status !== 'pending')
            throw new common_1.BadRequestException('Request is not pending');
        req.status = 'accepted';
        req.acceptedAt = new Date();
        await this.reqRepo.save(req);
        await this.redis.zrem(`room:${req.room.id}:queue`, requestId);
        await this.decrementUserActiveRequests(req.requester.id, req.room.id);
        await this.userRepo.increment({ id: req.requester.id }, 'totalAccepts', 1);
        const user = await this.userRepo.findOne({ where: { id: req.requester.id } });
        if (user) {
            if (user.totalAccepts === 1 && !user.badges.includes('taste_maker')) {
                user.badges = [...user.badges, 'taste_maker'];
                await this.userRepo.save(user);
            }
            if (user.totalAccepts >= 3 && !user.badges.includes('crowd_favorite')) {
                user.badges = [...user.badges, 'crowd_favorite'];
                await this.userRepo.save(user);
            }
        }
        this.gateway.notifyUser(req.requester.id, 'your_song_playing', {
            requestId,
            title: req.title,
            artist: req.artist,
        });
        this.gateway.broadcastToRoom(req.room.id, 'request_accepted', {
            requestId,
            title: req.title,
            artist: req.artist,
            requesterName: req.requester.displayName,
        });
        await this.broadcastQueueUpdate(req.room.id);
        return req;
    }
    async rejectRequest(requestId, djId, reason) {
        const req = await this.reqRepo.findOne({ where: { id: requestId }, relations: ['room', 'room.dj', 'requester'] });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.room.dj?.id !== djId)
            throw new common_1.ForbiddenException('Not your room');
        req.status = 'rejected';
        await this.reqRepo.save(req);
        await this.redis.zrem(`room:${req.room.id}:queue`, requestId);
        await this.decrementUserActiveRequests(req.requester.id, req.room.id);
        this.gateway.broadcastToRoom(req.room.id, 'request_rejected', { requestId, reason: reason || null });
        await this.broadcastQueueUpdate(req.room.id);
    }
    async withdrawRequest(requestId, userId) {
        const req = await this.reqRepo.findOne({ where: { id: requestId }, relations: ['room', 'requester'] });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.requester.id !== userId)
            throw new common_1.ForbiddenException('Not your request');
        if (req.status !== 'pending')
            throw new common_1.BadRequestException('Cannot withdraw non-pending request');
        req.status = 'rejected';
        await this.reqRepo.save(req);
        await this.redis.zrem(`room:${req.room.id}:queue`, requestId);
        await this.decrementUserActiveRequests(userId, req.room.id);
        await this.broadcastQueueUpdate(req.room.id);
    }
    async expireOldRequests() {
        const cutoff = new Date(Date.now() - REQUEST_EXPIRY_HOURS * 3600000);
        const expired = await this.reqRepo
            .createQueryBuilder('r')
            .where('r.status = :status', { status: 'pending' })
            .andWhere('r.requestedAt < :cutoff', { cutoff })
            .leftJoinAndSelect('r.room', 'room')
            .getMany();
        for (const req of expired) {
            req.status = 'expired';
            await this.reqRepo.save(req);
            await this.redis.zrem(`room:${req.room.id}:queue`, req.id);
        }
    }
    async recomputeAllRoomScores() {
        const activeRoomKeys = await this.redis.keys('room:*:queue');
        for (const key of activeRoomKeys) {
            const roomId = key.split(':')[1];
            const ids = await this.redis.zrevrange(key, 0, -1);
            for (const id of ids) {
                const req = await this.reqRepo.findOne({ where: { id } });
                if (req && req.status === 'pending') {
                    const score = this.computeRankingScore(req);
                    req.rankingScore = score;
                    await this.reqRepo.save(req);
                    await this.redis.zadd(key, score, id);
                }
            }
            await this.broadcastQueueUpdate(roomId);
        }
    }
    async decrementUserActiveRequests(userId, roomId) {
        const key = `user:${userId}:active_requests:${roomId}`;
        const current = parseInt((await this.redis.get(key)) || '0');
        if (current > 0) {
            await this.redis.set(key, String(current - 1));
        }
    }
    async broadcastQueueUpdate(roomId) {
        const queue = await this.getQueue(roomId);
        this.gateway.broadcastQueueUpdate(roomId, queue);
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(song_request_entity_1.SongRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(vote_entity_1.Vote)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService,
        events_gateway_1.EventsGateway,
        music_service_1.MusicService])
], RequestsService);
//# sourceMappingURL=requests.service.js.map