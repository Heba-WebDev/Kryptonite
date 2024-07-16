import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { OTP } from 'src/entities/otp.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, OTP])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
