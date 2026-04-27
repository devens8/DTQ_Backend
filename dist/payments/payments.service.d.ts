import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { SongRequest } from '../entities/song-request.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';
export declare class PaymentsService {
    private config;
    private txRepo;
    private reqRepo;
    private redis;
    private gateway;
    private readonly logger;
    private stripe;
    constructor(config: ConfigService, txRepo: Repository<Transaction>, reqRepo: Repository<SongRequest>, redis: RedisService, gateway: EventsGateway);
    createBoostPaymentIntent(userId: string, roomId: string, requestId: string, boostType: string): Promise<{
        clientSecret: string;
        paymentIntentId: string;
        amountCents: number;
    }>;
    handleWebhook(payload: Buffer, signature: string): Promise<void>;
}
