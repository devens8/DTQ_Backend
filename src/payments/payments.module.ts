import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Transaction } from '../entities/transaction.entity';
import { SongRequest } from '../entities/song-request.entity';
import { RedisModule } from '../redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, SongRequest]), RedisModule, GatewayModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
