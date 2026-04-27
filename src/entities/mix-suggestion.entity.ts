import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';

@Entity('mix_suggestions')
export class MixSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromTrackId: string;

  @Column()
  fromTitle: string;

  @Column()
  toTrackId: string;

  @Column()
  toTitle: string;

  @Column({ default: 1 })
  voteCount: number;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  suggestedAt: Date;

  @ManyToOne(() => Room, { eager: false })
  room: Room;

  @ManyToOne(() => User, { eager: false })
  suggester: User;
}
