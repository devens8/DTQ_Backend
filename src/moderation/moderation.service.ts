import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { EventsGateway } from '../gateway/events.gateway';

const BLOCKED_KEYWORDS = ['explicit_example']; // Extend as needed

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private gateway: EventsGateway,
  ) {}

  checkContentFilter(title: string, artist: string, explicit: boolean, settings: any): boolean {
    if (explicit && settings?.explicitBlocked) return true;
    const combined = `${title} ${artist}`.toLowerCase();
    return BLOCKED_KEYWORDS.some(kw => combined.includes(kw));
  }

  async banUserFromRoom(roomId: string, targetUserId: string, djId: string, reason: string): Promise<void> {
    const target = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    // Notify the banned user
    this.gateway.notifyUser(targetUserId, 'you_were_banned', { roomId, reason });
    this.gateway.broadcastToDJ(roomId, 'user_banned', { userId: targetUserId, reason });
  }
}
