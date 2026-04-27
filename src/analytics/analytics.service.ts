import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayHistory } from '../entities/play-history.entity';
import { SongRequest } from '../entities/song-request.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PlayHistory) private historyRepo: Repository<PlayHistory>,
    @InjectRepository(SongRequest) private reqRepo: Repository<SongRequest>,
  ) {}

  async getRoomSummary(roomId: string) {
    const totalRequests = await this.reqRepo.count({ where: { room: { id: roomId } } });
    const acceptedRequests = await this.reqRepo.count({ where: { room: { id: roomId }, status: 'accepted' } });
    const playedRequests = await this.reqRepo.count({ where: { room: { id: roomId }, status: 'played' } });

    const topRequested = await this.reqRepo
      .createQueryBuilder('r')
      .where('r.roomId = :roomId', { roomId })
      .orderBy('r.voteCount', 'DESC')
      .take(10)
      .getMany();

    const playHistory = await this.historyRepo.find({
      where: { room: { id: roomId } },
      order: { playedAt: 'DESC' },
      take: 50,
    });

    return {
      totalRequests,
      acceptedRequests,
      playedRequests,
      acceptanceRate: totalRequests > 0 ? Math.round((acceptedRequests / totalRequests) * 100) : 0,
      topRequested: topRequested.map(r => ({
        title: r.title,
        artist: r.artist,
        voteCount: r.voteCount,
        status: r.status,
      })),
      playHistory: playHistory.map(h => ({
        title: h.title,
        artist: h.artist,
        playedAt: h.playedAt,
        source: h.source,
        totalVotes: h.totalVotes,
      })),
    };
  }
}
