import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { OTP } from 'src/entities/otp.entity';
import { UsersService } from './users.service';
import { CqrsModule } from '@nestjs/cqrs';
import { RegisterUserHandler } from './handlers/register-user.handler';
import { EmailExistsQuery } from './queries/email-exists.query';
import { GetUserQuery } from './queries/get-user.query';
import { LoginUserHandler } from './handlers/login-user.handler';
const CommandHandlers = [LoginUserHandler, RegisterUserHandler];
const QueryHandlers = [EmailExistsQuery, GetUserQuery];

@Module({
  imports: [TypeOrmModule.forFeature([User, OTP]), CqrsModule],
  providers: [UsersService, ...CommandHandlers, ...QueryHandlers],
  controllers: [UsersController],
})
export class UsersModule {}
