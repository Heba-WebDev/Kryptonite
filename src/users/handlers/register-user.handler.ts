import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterUserCommand } from '../commands/register-user.command';
import { User } from 'src/entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { EmailExistsQuery } from '../queries/email-exists.query';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userSerive: UsersService,
    private readonly emailExists: EmailExistsQuery,
  ) {}
  async execute(command: RegisterUserCommand): Promise<string> {
    const { email } = command.registerDto;
    const user = await this.emailExists.checkIfEmailExists(email);
    if (user) throw new ConflictException('Email already exsits');
    const newUser = this.userRepository.create({ email });
    await this.userRepository.save(newUser);
    this.userSerive.confirmation_email(email);
    return 'Registration successfully completed';
  }
}
