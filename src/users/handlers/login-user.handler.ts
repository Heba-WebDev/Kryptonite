import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginUserCommand } from '../commands/login-user.command';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { GetUserQuery } from '../queries/get-user.query';
import { OTP } from '../../entities/otp.entity';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    @InjectRepository(User)
    private readonly otpRepository: Repository<OTP>,
    private readonly user: GetUserQuery,
    private readonly userSerive: UsersService,
  ) {}
  async execute(command: LoginUserCommand): Promise<string> {
    const { email } = command.dto;
    const user = await this.user.get(email);
    if (!user) throw new BadRequestException('No user found');
    const code = await this.userSerive.generate_otp(user);
    await this.userSerive.opt_email(email, code);
    return 'A six-digit code has been sent to your email';
  }

  async generate_otp(user: User) {
    const min = 100000;
    const max = 999999;
    const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
    const createdAt = new Date();
    const expirationDate = new Date(createdAt.getTime() + 10 * 60 * 1000);
    const otp = this.otpRepository.create({
      user: user,
      code: randomCode.toString(),
      created_at: createdAt,
      expires_at: expirationDate,
    });
    await this.otpRepository.save(otp);
    return randomCode.toString();
  }
}
