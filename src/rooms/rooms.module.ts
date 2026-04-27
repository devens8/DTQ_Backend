import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from '../entities/room.entity';
import { Venue } from '../entities/venue.entity';
import { User } from '../entities/user.entity';
import { SongRequest } from '../entities/song-request.entity';
import { RedisModule } from '../redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Venue, User, SongRequest]), RedisModule, GatewayModule],
  providers: [RoomsService],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
