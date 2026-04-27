import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Room } from '../entities/room.entity';

const DEMO_DJS = [
  { id: 'dj-0000-0001-0000-000000000001', email: 'vikram@dtq.demo', displayName: 'DJ Vikram' },
  { id: 'dj-0000-0002-0000-000000000002', email: 'priya@dtq.demo',  displayName: 'DJ Priya'  },
  { id: 'dj-0000-0003-0000-000000000003', email: 'arjun@dtq.demo',  displayName: 'DJ Arjun'  },
];

const DEMO_ROOMS = [
  { id: 'rm-00000000-0000-0000-0000-000000000001', code: 'FIRE01', name: 'Main Stage',      djIdx: 0 },
  { id: 'rm-00000000-0000-0000-0000-000000000002', code: 'VIBE42', name: 'Rooftop Lounge',  djIdx: 1 },
  { id: 'rm-00000000-0000-0000-0000-000000000003', code: 'DESI24', name: 'Dance Floor',     djIdx: 2 },
  { id: 'rm-00000000-0000-0000-0000-000000000004', code: 'BANG22', name: 'VIP Room',        djIdx: 0 },
  { id: 'rm-00000000-0000-0000-0000-000000000005', code: 'BASS77', name: 'After Party',     djIdx: 1 },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDJs();
    await this.seedRooms();
  }

  private async seedDJs() {
    for (const dj of DEMO_DJS) {
      const exists = await this.userRepo.findOne({ where: { id: dj.id } });
      if (!exists) {
        await this.userRepo.save(
          this.userRepo.create({
            id: dj.id,
            type: 'dj',
            email: dj.email,
            displayName: dj.displayName,
            avatarSeed: dj.id.slice(0, 8),
            badges: [],
          }),
        );
        this.logger.log(`Seeded DJ: ${dj.displayName}`);
      }
    }
  }

  private async seedRooms() {
    for (const room of DEMO_ROOMS) {
      const exists = await this.roomRepo.findOne({ where: { code: room.code } });
      if (!exists) {
        const dj = { id: DEMO_DJS[room.djIdx].id } as User;
        await this.roomRepo.save(
          this.roomRepo.create({
            id: room.id,
            code: room.code,
            qrToken: `qr-${room.code.toLowerCase()}`,
            name: room.name,
            status: 'active',
            mode: 'normal',
            settings: {},
            dj,
          }),
        );
        this.logger.log(`Seeded room: ${room.code} — ${room.name}`);
      }
    }
  }
}
