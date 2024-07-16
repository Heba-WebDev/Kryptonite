import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  BeforeInsert,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class OTP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @CreateDateColumn()
  created_at: Date;

  @Column()
  expires_at: Date;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @BeforeInsert()
  setExpirationDate() {
    const expirationDate = new Date(this.created_at.getTime() + 10 * 60 * 1000);
    this.expires_at = expirationDate;
  }
}
