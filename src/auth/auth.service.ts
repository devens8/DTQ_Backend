import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

const ADJECTIVES = ['Funky', 'Cosmic', 'Electric', 'Neon', 'Groovy', 'Stellar', 'Velvet', 'Bass', 'Wild', 'Midnight'];
const NOUNS = ['Panda', 'Phoenix', 'Vibe', 'Groove', 'Wave', 'Spark', 'Beat', 'Pulse', 'Echo', 'Storm'];

function generateDisplayName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async createAnonymousSession(fingerprint: string, displayName?: string): Promise<{ token: string; user: User }> {
    let user = await this.userRepo.findOne({ where: { fingerprint } });

    if (!user) {
      user = this.userRepo.create({
        fingerprint,
        type: 'attendee',
        displayName: displayName || generateDisplayName(),
        avatarSeed: uuidv4().slice(0, 8),
        badges: [],
      });
      user = await this.userRepo.save(user);
    } else if (displayName && displayName !== user.displayName) {
      user.displayName = displayName;
      user = await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, type: user.type, fingerprint });
    return { token, user };
  }

  async createDJSession(email: string, displayName: string): Promise<{ token: string; user: User }> {
    let user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      user = this.userRepo.create({
        email,
        type: 'dj',
        displayName: displayName || `DJ ${uuidv4().slice(0, 6).toUpperCase()}`,
        avatarSeed: uuidv4().slice(0, 8),
        badges: [],
      });
      user = await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, type: user.type });
    return { token, user };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      return this.userRepo.findOne({ where: { id: payload.sub } });
    } catch {
      return null;
    }
  }
}
