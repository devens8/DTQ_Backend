import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity('venues')
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: 'free' })
  subscriptionTier: string;

  @Column('jsonb', { default: {} })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: false, nullable: true })
  owner: User;

  @OneToMany(() => Room, (room) => room.venue, { eager: false })
  rooms: Room[];
}
