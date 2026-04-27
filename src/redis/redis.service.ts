import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private available = false;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL not set — running without Redis (queue stored in DB only)');
      return;
    }

    try {
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 3000,
      });
      this.subscriber = new Redis(url, {
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

      // Attempt connection (non-blocking)
      this.client.connect().catch(() => {});
      this.subscriber.connect().catch(() => {});
    } catch (e) {
      this.logger.warn('Redis init failed — running without cache');
    }
  }

  isAvailable(): boolean {
    return this.available && this.client !== null;
  }

  onModuleDestroy() {
    this.client?.disconnect();
    this.subscriber?.disconnect();
  }

  getClient(): Redis | null { return this.client; }
  getSubscriber(): Redis | null { return this.subscriber; }

  private async safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    if (!this.client || !this.available) return fallback;
    try { return await fn(); } catch { return fallback; }
  }

  async get(key: string): Promise<string | null> {
    return this.safe(() => this.client!.get(key), null);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.safe(async () => {
      if (ttl) await this.client!.set(key, value, 'EX', ttl);
      else await this.client!.set(key, value);
    }, undefined);
  }

  async del(key: string): Promise<void> {
    await this.safe(() => this.client!.del(key), undefined);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.safe(() => this.client!.zadd(key, score, member) as any, undefined);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.safe(() => this.client!.zrevrange(key, start, stop), []);
  }

  async zrevrangeWithScores(key: string, start: number, stop: number): Promise<{ member: string; score: number }[]> {
    return this.safe(async () => {
      const raw = await this.client!.zrevrange(key, start, stop, 'WITHSCORES');
      const results: { member: string; score: number }[] = [];
      for (let i = 0; i < raw.length; i += 2) {
        results.push({ member: raw[i], score: parseFloat(raw[i + 1]) });
      }
      return results;
    }, []);
  }

  async zrem(key: string, member: string): Promise<void> {
    await this.safe(() => this.client!.zrem(key, member) as any, undefined);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    return this.safe(async () => {
      const score = await this.client!.zscore(key, member);
      return score !== null ? parseFloat(score) : null;
    }, null);
  }

  async zcard(key: string): Promise<number> {
    return this.safe(() => this.client!.zcard(key), 0);
  }

  async incr(key: string): Promise<number> {
    return this.safe(() => this.client!.incr(key), 0);
  }

  async incrby(key: string, amount: number): Promise<number> {
    return this.safe(() => this.client!.incrby(key, amount), 0);
  }

  async decr(key: string): Promise<number> {
    return this.safe(() => this.client!.decr(key), 0);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.safe(() => this.client!.expire(key, ttl) as any, undefined);
  }

  async ttl(key: string): Promise<number> {
    return this.safe(() => this.client!.ttl(key), -1);
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    await this.safe(() => this.client!.sadd(key, ...members) as any, undefined);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return this.safe(async () => (await this.client!.sismember(key, member)) === 1, false);
  }

  async smembers(key: string): Promise<string[]> {
    return this.safe(() => this.client!.smembers(key), []);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.safe(() => this.client!.srem(key, member) as any, undefined);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.safe(() => this.client!.hset(key, field, value) as any, undefined);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.safe(() => this.client!.hget(key, field), null);
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    return this.safe(async () => {
      const result = await this.client!.hgetall(key);
      if (!result || Object.keys(result).length === 0) return null;
      return result;
    }, null);
  }

  async hmset(key: string, data: Record<string, string>): Promise<void> {
    await this.safe(() => this.client!.hmset(key, data) as any, undefined);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.safe(() => this.client!.hdel(key, field) as any, undefined);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.safe(() => this.client!.publish(channel, message) as any, undefined);
  }

  async subscribe(channel: string, handler: (message: string, channel: string) => void): Promise<void> {
    if (!this.subscriber || !this.available) return;
    await this.safe(async () => {
      await this.subscriber!.subscribe(channel);
      this.subscriber!.on('message', (ch, msg) => {
        if (ch === channel) handler(msg, ch);
      });
    }, undefined);
  }

  async psubscribe(pattern: string, handler: (message: string, channel: string) => void): Promise<void> {
    if (!this.subscriber || !this.available) return;
    await this.safe(async () => {
      await this.subscriber!.psubscribe(pattern);
      this.subscriber!.on('pmessage', (_pattern, channel, msg) => handler(msg, channel));
    }, undefined);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.safe(() => this.client!.keys(pattern), []);
  }

  async exists(key: string): Promise<boolean> {
    return this.safe(async () => (await this.client!.exists(key)) === 1, false);
  }
}
