import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Room])],
  providers: [SeedService],
})
export class SeedModule {}
