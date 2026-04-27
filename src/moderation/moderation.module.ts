import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { User } from '../entities/user.entity';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), GatewayModule],
  providers: [ModerationService],
  controllers: [ModerationController],
})
export class ModerationModule {}
