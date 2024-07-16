import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { OTP } from './otp.entity';
import { File } from './file.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  api_key: string;

  @Column({ default: false })
  is_verified: boolean;

  @OneToMany(() => File, (file) => file.user)
  files: File[];

  @OneToMany(() => OTP, (otp) => otp.user)
  otp: OTP[];
}
