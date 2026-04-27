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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.client = null;
        this.subscriber = null;
        this.available = false;
        const url = this.config.get('REDIS_URL');
        if (!url) {
            this.logger.warn('REDIS_URL not set — running without Redis (queue stored in DB only)');
            return;
        }
        try {
            this.client = new ioredis_1.default(url, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false,
                connectTimeout: 3000,
            });
            this.subscriber = new ioredis_1.default(url, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false,
                connectTimeout: 3000,
            });
            this.client.on('ready', () => {
                this.available = true;
                this.logger.log('Redis connected');
            });
            this.client.on('error', (err) => {
                this.available = false;
                this.logger.warn(`Redis error: ${err.message}`);
            });
            this.subscriber.on('error', (err) => {
                this.logger.warn(`Redis subscriber error: ${err.message}`);
            });
            this.client.connect().catch(() => { });
            this.subscriber.connect().catch(() => { });
        }
        catch (e) {
            this.logger.warn('Redis init failed — running without cache');
        }
    }
    isAvailable() {
        return this.available && this.client !== null;
    }
    onModuleDestroy() {
        this.client?.disconnect();
        this.subscriber?.disconnect();
    }
    getClient() { return this.client; }
    getSubscriber() { return this.subscriber; }
    async safe(fn, fallback) {
        if (!this.client || !this.available)
            return fallback;
        try {
            return await fn();
        }
        catch {
            return fallback;
        }
    }
    async get(key) {
        return this.safe(() => this.client.get(key), null);
    }
    async set(key, value, ttl) {
        await this.safe(async () => {
            if (ttl)
                await this.client.set(key, value, 'EX', ttl);
            else
                await this.client.set(key, value);
        }, undefined);
    }
    async del(key) {
        await this.safe(() => this.client.del(key), undefined);
    }
    async zadd(key, score, member) {
        await this.safe(() => this.client.zadd(key, score, member), undefined);
    }
    async zrevrange(key, start, stop) {
        return this.safe(() => this.client.zrevrange(key, start, stop), []);
    }
    async zrevrangeWithScores(key, start, stop) {
        return this.safe(async () => {
            const raw = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
            const results = [];
            for (let i = 0; i < raw.length; i += 2) {
                results.push({ member: raw[i], score: parseFloat(raw[i + 1]) });
            }
            return results;
        }, []);
    }
    async zrem(key, member) {
        await this.safe(() => this.client.zrem(key, member), undefined);
    }
    async zscore(key, member) {
        return this.safe(async () => {
            const score = await this.client.zscore(key, member);
            return score !== null ? parseFloat(score) : null;
        }, null);
    }
    async zcard(key) {
        return this.safe(() => this.client.zcard(key), 0);
    }
    async incr(key) {
        return this.safe(() => this.client.incr(key), 0);
    }
    async incrby(key, amount) {
        return this.safe(() => this.client.incrby(key, amount), 0);
    }
    async decr(key) {
        return this.safe(() => this.client.decr(key), 0);
    }
    async expire(key, ttl) {
        await this.safe(() => this.client.expire(key, ttl), undefined);
    }
    async ttl(key) {
        return this.safe(() => this.client.ttl(key), -1);
    }
    async sadd(key, ...members) {
        await this.safe(() => this.client.sadd(key, ...members), undefined);
    }
    async sismember(key, member) {
        return this.safe(async () => (await this.client.sismember(key, member)) === 1, false);
    }
    async smembers(key) {
        return this.safe(() => this.client.smembers(key), []);
    }
    async srem(key, member) {
        await this.safe(() => this.client.srem(key, member), undefined);
    }
    async hset(key, field, value) {
        await this.safe(() => this.client.hset(key, field, value), undefined);
    }
    async hget(key, field) {
        return this.safe(() => this.client.hget(key, field), null);
    }
    async hgetall(key) {
        return this.safe(async () => {
            const result = await this.client.hgetall(key);
            if (!result || Object.keys(result).length === 0)
                return null;
            return result;
        }, null);
    }
    async hmset(key, data) {
        await this.safe(() => this.client.hmset(key, data), undefined);
    }
    async hdel(key, field) {
        await this.safe(() => this.client.hdel(key, field), undefined);
    }
    async publish(channel, message) {
        await this.safe(() => this.client.publish(channel, message), undefined);
    }
    async subscribe(channel, handler) {
        if (!this.subscriber || !this.available)
            return;
        await this.safe(async () => {
            await this.subscriber.subscribe(channel);
            this.subscriber.on('message', (ch, msg) => {
                if (ch === channel)
                    handler(msg, ch);
            });
        }, undefined);
    }
    async psubscribe(pattern, handler) {
        if (!this.subscriber || !this.available)
            return;
        await this.safe(async () => {
            await this.subscriber.psubscribe(pattern);
            this.subscriber.on('pmessage', (_pattern, channel, msg) => handler(msg, channel));
        }, undefined);
    }
    async keys(pattern) {
        return this.safe(() => this.client.keys(pattern), []);
    }
    async exists(key) {
        return this.safe(async () => (await this.client.exists(key)) === 1, false);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map