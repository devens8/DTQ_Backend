import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';
import { SongRequest } from './song-request.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // boost | fast_pass | must_play

  @Column()
  amountCents: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ nullable: true, unique: true })
  stripePaymentId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: false })
  user: User;

  @ManyToOne(() => Room, { eager: false })
  room: Room;

  @ManyToOne(() => SongRequest, { nullable: true, eager: false })
  songRequest: SongRequest;
}
