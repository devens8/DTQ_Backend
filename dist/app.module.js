"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const user_entity_1 = require("./entities/user.entity");
const venue_entity_1 = require("./entities/venue.entity");
const room_entity_1 = require("./entities/room.entity");
const song_request_entity_1 = require("./entities/song-request.entity");
const vote_entity_1 = require("./entities/vote.entity");
const mix_suggestion_entity_1 = require("./entities/mix-suggestion.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
const play_history_entity_1 = require("./entities/play-history.entity");
const redis_module_1 = require("./redis/redis.module");
const auth_module_1 = require("./auth/auth.module");
const rooms_module_1 = require("./rooms/rooms.module");
const requests_module_1 = require("./requests/requests.module");
const votes_module_1 = require("./votes/votes.module");
const music_module_1 = require("./music/music.module");
const now_playing_module_1 = require("./now-playing/now-playing.module");
const gateway_module_1 = require("./gateway/gateway.module");
const payments_module_1 = require("./payments/payments.module");
const mix_suggestions_module_1 = require("./mix-suggestions/mix-suggestions.module");
const analytics_module_1 = require("./analytics/analytics.module");
const moderation_module_1 = require("./moderation/moderation.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
const seed_module_1 = require("./seed/seed.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    url: config.get('DATABASE_URL'),
                    entities: [
                        user_entity_1.User,
                        venue_entity_1.Venue,
                        room_entity_1.Room,
                        song_request_entity_1.SongRequest,
                        vote_entity_1.Vote,
                        mix_suggestion_entity_1.MixSuggestion,
                        transaction_entity_1.Transaction,
                        play_history_entity_1.PlayHistory,
                    ],
                    synchronize: true,
                    logging: process.env.NODE_ENV !== 'production',
                }),
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            rooms_module_1.RoomsModule,
            requests_module_1.RequestsModule,
            votes_module_1.VotesModule,
            music_module_1.MusicModule,
            now_playing_module_1.NowPlayingModule,
            gateway_module_1.GatewayModule,
            payments_module_1.PaymentsModule,
            mix_suggestions_module_1.MixSuggestionsModule,
            analytics_module_1.AnalyticsModule,
            moderation_module_1.ModerationModule,
            scheduler_module_1.SchedulerModule,
            seed_module_1.SeedModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map