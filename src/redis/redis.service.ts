import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly subscriber: Redis;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 3 });
    this.subscriber = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 3 });

    this.client.on('error', (err) => this.logger.error('Redis client error', err));
    this.subscriber.on('error', (err) => this.logger.error('Redis subscriber error', err));
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.subscriber.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrevrange(key, start, stop);
  }

  async zrevrangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ member: string; score: number }[]> {
    const raw = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
    const results: { member: string; score: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      results.push({ member: raw[i], score: parseFloat(raw[i + 1]) });
    }
    return results;
  }

  async zrem(key: string, member: string): Promise<void> {
    await this.client.zrem(key, member);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    const score = await this.client.zscore(key, member);
    return score !== null ? parseFloat(score) : null;
  }

  async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async incrby(key: string, amount: number): Promise<number> {
    return this.client.incrby(key, amount);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    await this.client.sadd(key, ...members);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.client.srem(key, member);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    const result = await this.client.hgetall(key);
    if (!result || Object.keys(result).length === 0) return null;
    return result;
  }

  async hmset(key: string, data: Record<string, string>): Promise<void> {
    await this.client.hmset(key, data);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.client.hdel(key, field);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, handler: (message: string, channel: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        handler(msg, ch);
      }
    });
  }

  async psubscribe(pattern: string, handler: (message: string, channel: string) => void): Promise<void> {
    await this.subscriber.psubscribe(pattern);
    this.subscriber.on('pmessage', (_pattern, channel, msg) => {
      handler(msg, channel);
    });
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}
