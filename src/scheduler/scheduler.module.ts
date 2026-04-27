import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [RequestsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
