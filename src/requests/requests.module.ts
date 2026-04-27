import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { SongRequest } from '../entities/song-request.entity';
import { Vote } from '../entities/vote.entity';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';
import { RedisModule } from '../redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';
import { MusicModule } from '../music/music.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SongRequest, Vote, User, Room]),
    RedisModule,
    GatewayModule,
    MusicModule,
  ],
  providers: [RequestsService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
