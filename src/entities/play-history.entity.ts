import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Room } from './room.entity';
import { SongRequest } from './song-request.entity';

@Entity('play_history')
export class PlayHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trackId: string;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column({ default: 'dj' })
  source: string; // dj | accepted_request

  @Column({ default: 0 })
  totalVotes: number;

  @CreateDateColumn()
  playedAt: Date;

  @ManyToOne(() => Room, { eager: false })
  room: Room;

  @ManyToOne(() => SongRequest, { nullable: true, eager: false })
  songRequest: SongRequest;
}
