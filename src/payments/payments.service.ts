import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Transaction } from '../entities/transaction.entity';
import { SongRequest } from '../entities/song-request.entity';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../gateway/events.gateway';

const BOOST_PRICES: Record<string, number> = {
  small: 100,
  medium: 300,
  large: 500,
  must_play: 800,
  fast_pass: 1200,
};

const MAX_SPEND_PER_SESSION = 2500; // $25 in cents

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(SongRequest) private reqRepo: Repository<SongRequest>,
    private redis: RedisService,
    private gateway: EventsGateway,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2023-08-16' });
    }
  }

  async createBoostPaymentIntent(
    userId: string,
    roomId: string,
    requestId: string,
    boostType: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string; amountCents: number }> {
    if (!this.stripe) throw new BadRequestException('Payments not configured');

    const amountCents = BOOST_PRICES[boostType];
    if (!amountCents) throw new BadRequestException('Invalid boost type');

    // Check per-session spend cap
    const spendKey = `user:${userId}:session_spend:${roomId}`;
    const spent = parseInt((await this.redis.get(spendKey)) || '0');
    if (spent + amountCents > MAX_SPEND_PER_SESSION) {
      throw new BadRequestException('Session spend limit reached ($25 max per session)');
    }

    const req = await this.reqRepo.findOne({ where: { id: requestId } });
    if (!req) throw new BadRequestException('Request not found');

    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { userId, roomId, requestId, boostType },
      automatic_payment_methods: { enabled: true },
    });

    // Pre-create transaction record
    await this.txRepo.save(
      this.txRepo.create({
        user: { id: userId } as any,
        room: { id: roomId } as any,
        songRequest: { id: requestId } as any,
        type: boostType,
        amountCents,
        stripePaymentId: intent.id,
        status: 'pending',
      }),
    );

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id, amountCents };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!this.stripe) return;

    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      this.logger.error('Stripe webhook signature invalid', err.message);
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const { userId, roomId, requestId, boostType } = intent.metadata;

      // Update transaction
      await this.txRepo.update({ stripePaymentId: intent.id }, { status: 'completed' });

      // Track spend
      const spendKey = `user:${userId}:session_spend:${roomId}`;
      await this.redis.incrby(spendKey, intent.amount);
      await this.redis.expire(spendKey, 86400);

      // Apply boost to song request
      const req = await this.reqRepo.findOne({ where: { id: requestId } });
      if (!req) return;

      const boostDollars = intent.amount / 100;
      req.boostScore = parseFloat(String(req.boostScore)) + boostDollars;

      if (boostType === 'must_play') {
        req.priorityTag = 'must_play';
      } else if (boostType === 'fast_pass' && !req.priorityTag) {
        req.priorityTag = 'fast_pass';
      }

      // Recompute score
      const minutesSince = (Date.now() - new Date(req.requestedAt).getTime()) / 60000;
      const recencyBonus = Math.max(0, 60 - minutesSince * 2);
      const priorityBonus = req.priorityTag === 'must_play' ? 500 : req.priorityTag === 'fast_pass' ? 100 : 0;
      const score = req.voteCount * 10 + req.boostScore * 50 + recencyBonus + priorityBonus;
      req.rankingScore = score;

      await this.reqRepo.save(req);
      await this.redis.zadd(`room:${roomId}:queue`, score, requestId);

      // Notify DJ
      this.gateway.broadcastToDJ(roomId, 'boost_applied', {
        requestId,
        amount: boostDollars,
        boostType,
        newBoostScore: req.boostScore,
        priorityTag: req.priorityTag,
      });

      // Broadcast updated queue
      this.logger.log(`Boost applied: ${boostType} for $${boostDollars} on request ${requestId}`);
    }
  }
}
