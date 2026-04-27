import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { User } from './entities/user.entity';
import { Venue } from './entities/venue.entity';
import { Room } from './entities/room.entity';
import { SongRequest } from './entities/song-request.entity';
import { Vote } from './entities/vote.entity';
import { MixSuggestion } from './entities/mix-suggestion.entity';
import { Transaction } from './entities/transaction.entity';
import { PlayHistory } from './entities/play-history.entity';

import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { RequestsModule } from './requests/requests.module';
import { VotesModule } from './votes/votes.module';
import { MusicModule } from './music/music.module';
import { NowPlayingModule } from './now-playing/now-playing.module';
import { GatewayModule } from './gateway/gateway.module';
import { PaymentsModule } from './payments/payments.module';
import { MixSuggestionsModule } from './mix-suggestions/mix-suggestions.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ModerationModule } from './moderation/moderation.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          User,
          Venue,
          Room,
          SongRequest,
          Vote,
          MixSuggestion,
          Transaction,
          PlayHistory,
        ],
        synchronize: true,
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    ScheduleModule.forRoot(),

    RedisModule,
    AuthModule,
    RoomsModule,
    RequestsModule,
    VotesModule,
    MusicModule,
    NowPlayingModule,
    GatewayModule,
    PaymentsModule,
    MixSuggestionsModule,
    AnalyticsModule,
    ModerationModule,
    SchedulerModule,
    SeedModule,
  ],
})
export class AppModule {}
