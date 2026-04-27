import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';
import { Vote } from './vote.entity';

@Entity('song_requests')
export class SongRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trackId: string;

  @Column({ default: 'spotify' })
  trackSource: string;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column({ nullable: true })
  albumArtUrl: string;

  @Column({ nullable: true, type: 'int' })
  durationMs: number;

  @Column({ nullable: true, type: 'float' })
  bpm: number;

  @Column({ nullable: true })
  genre: string;

  @Column({ default: false })
  explicit: boolean;

  @Column({ default: 1 })
  voteCount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  boostScore: number;

  @Column({ default: 'pending' })
  status: string; // pending | accepted | rejected | played | expired

  @Column({ nullable: true })
  priorityTag: string; // null | fast_pass | must_play

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  rankingScore: number;

  @CreateDateColumn()
  requestedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  acceptedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  playedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => Room, (r) => r.requests, { eager: false })
  room: Room;

  @ManyToOne(() => User, { eager: false })
  requester: User;

  @OneToMany(() => Vote, (v) => v.songRequest, { eager: false })
  votes: Vote[];
}
