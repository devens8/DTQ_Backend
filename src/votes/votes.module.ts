import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { Vote } from '../entities/vote.entity';
import { SongRequest } from '../entities/song-request.entity';
import { Room } from '../entities/room.entity';
import { RedisModule } from '../redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, SongRequest, Room]), RedisModule, GatewayModule],
  providers: [VotesService],
  controllers: [VotesController],
  exports: [VotesService],
})
export class VotesModule {}
