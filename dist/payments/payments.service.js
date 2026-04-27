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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stripe_1 = require("stripe");
const transaction_entity_1 = require("../entities/transaction.entity");
const song_request_entity_1 = require("../entities/song-request.entity");
const redis_service_1 = require("../redis/redis.service");
const events_gateway_1 = require("../gateway/events.gateway");
const BOOST_PRICES = {
    small: 100,
    medium: 300,
    large: 500,
    must_play: 800,
    fast_pass: 1200,
};
const MAX_SPEND_PER_SESSION = 2500;
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(config, txRepo, reqRepo, redis, gateway) {
        this.config = config;
        this.txRepo = txRepo;
        this.reqRepo = reqRepo;
        this.redis = redis;
        this.gateway = gateway;
        this.logger = new common_1.Logger(PaymentsService_1.name);
        const key = this.config.get('STRIPE_SECRET_KEY');
        if (key) {
            this.stripe = new stripe_1.default(key, { apiVersion: '2023-08-16' });
        }
    }
    async createBoostPaymentIntent(userId, roomId, requestId, boostType) {
        if (!this.stripe)
            throw new common_1.BadRequestException('Payments not configured');
        const amountCents = BOOST_PRICES[boostType];
        if (!amountCents)
            throw new common_1.BadRequestException('Invalid boost type');
        const spendKey = `user:${userId}:session_spend:${roomId}`;
        const spent = parseInt((await this.redis.get(spendKey)) || '0');
        if (spent + amountCents > MAX_SPEND_PER_SESSION) {
            throw new common_1.BadRequestException('Session spend limit reached ($25 max per session)');
        }
        const req = await this.reqRepo.findOne({ where: { id: requestId } });
        if (!req)
            throw new common_1.BadRequestException('Request not found');
        const intent = await this.stripe.paymentIntents.create({
            amount: amountCents,
            currency: 'usd',
            metadata: { userId, roomId, requestId, boostType },
            automatic_payment_methods: { enabled: true },
        });
        await this.txRepo.save(this.txRepo.create({
            user: { id: userId },
            room: { id: roomId },
            songRequest: { id: requestId },
            type: boostType,
            amountCents,
            stripePaymentId: intent.id,
            status: 'pending',
        }));
        return { clientSecret: intent.client_secret, paymentIntentId: intent.id, amountCents };
    }
    async handleWebhook(payload, signature) {
        if (!this.stripe)
            return;
        const secret = this.config.get('STRIPE_WEBHOOK_SECRET');
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, secret);
        }
        catch (err) {
            this.logger.error('Stripe webhook signature invalid', err.message);
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object;
            const { userId, roomId, requestId, boostType } = intent.metadata;
            await this.txRepo.update({ stripePaymentId: intent.id }, { status: 'completed' });
            const spendKey = `user:${userId}:session_spend:${roomId}`;
            await this.redis.incrby(spendKey, intent.amount);
            await this.redis.expire(spendKey, 86400);
            const req = await this.reqRepo.findOne({ where: { id: requestId } });
            if (!req)
                return;
            const boostDollars = intent.amount / 100;
            req.boostScore = parseFloat(String(req.boostScore)) + boostDollars;
            if (boostType === 'must_play') {
                req.priorityTag = 'must_play';
            }
            else if (boostType === 'fast_pass' && !req.priorityTag) {
                req.priorityTag = 'fast_pass';
            }
            const minutesSince = (Date.now() - new Date(req.requestedAt).getTime()) / 60000;
            const recencyBonus = Math.max(0, 60 - minutesSince * 2);
            const priorityBonus = req.priorityTag === 'must_play' ? 500 : req.priorityTag === 'fast_pass' ? 100 : 0;
            const score = req.voteCount * 10 + req.boostScore * 50 + recencyBonus + priorityBonus;
            req.rankingScore = score;
            await this.reqRepo.save(req);
            await this.redis.zadd(`room:${roomId}:queue`, score, requestId);
            this.gateway.broadcastToDJ(roomId, 'boost_applied', {
                requestId,
                amount: boostDollars,
                boostType,
                newBoostScore: req.boostScore,
                priorityTag: req.priorityTag,
            });
            this.logger.log(`Boost applied: ${boostType} for $${boostDollars} on request ${requestId}`);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(2, (0, typeorm_1.InjectRepository)(song_request_entity_1.SongRequest)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService,
        events_gateway_1.EventsGateway])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map