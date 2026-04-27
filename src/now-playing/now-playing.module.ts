import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NowPlayingService } from './now-playing.service';
import { NowPlayingController } from './now-playing.controller';
import { PlayHistory } from '../entities/play-history.entity';
import { SongRequest } from '../entities/song-request.entity';
import { Room } from '../entities/room.entity';
import { RedisModule } from '../redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlayHistory, SongRequest, Room]), RedisModule, GatewayModule],
  providers: [NowPlayingService],
  controllers: [NowPlayingController],
  exports: [NowPlayingService],
})
export class NowPlayingModule {}
