import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Venue } from './venue.entity';
import { User } from './user.entity';
import { SongRequest } from './song-request.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // e.g. FIRE2024

  @Column({ unique: true })
  qrToken: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: 'active' })
  status: string; // active | paused | closed

  @Column({ default: 'normal' })
  mode: string; // normal | override

  @Column({ nullable: true })
  playlistSource: string;

  @Column('jsonb', { default: {} })
  settings: Record<string, any>;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  closedAt: Date;

  @ManyToOne(() => Venue, { nullable: true, eager: false })
  venue: Venue;

  @ManyToOne(() => User, { nullable: true, eager: false })
  dj: User;

  @OneToMany(() => SongRequest, (r) => r.room, { eager: false })
  requests: SongRequest[];
}
