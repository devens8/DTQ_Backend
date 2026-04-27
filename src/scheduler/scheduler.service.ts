import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RequestsService } from '../requests/requests.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly requests: RequestsService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async recomputeRankings() {
    try {
      await this.requests.recomputeAllRoomScores();
    } catch (err) {
      this.logger.error('Failed to recompute rankings', err.message);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireRequests() {
    try {
      await this.requests.expireOldRequests();
    } catch (err) {
      this.logger.error('Failed to expire old requests', err.message);
    }
  }
}
