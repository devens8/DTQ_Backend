import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'attendee' })
  type: string; // attendee | dj | venue_owner

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true, unique: true })
  fingerprint: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  avatarSeed: string;

  @Column({ default: 0 })
  totalAccepts: number;

  @Column({ default: 0 })
  totalRequests: number;

  @Column('simple-array', { default: '' })
  badges: string[];

  @CreateDateColumn()
  createdAt: Date;
}
