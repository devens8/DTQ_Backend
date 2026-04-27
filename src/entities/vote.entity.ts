import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { SongRequest } from './song-request.entity';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('votes')
@Unique(['songRequest', 'user'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  votedAt: Date;

  @ManyToOne(() => SongRequest, (r) => r.votes, { eager: false })
  songRequest: SongRequest;

  @ManyToOne(() => User, { eager: false })
  user: User;

  @ManyToOne(() => Room, { eager: false })
  room: Room;
}
