import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PlayHistory } from '../entities/play-history.entity';
import { SongRequest } from '../entities/song-request.entity';
import { Vote } from '../entities/vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayHistory, SongRequest, Vote])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
