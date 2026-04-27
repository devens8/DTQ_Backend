import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('rooms/:roomId/analytics/summary')
  summary(@Param('roomId') roomId: string) {
    return this.analytics.getRoomSummary(roomId);
  }
}
