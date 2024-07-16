import { EmailUserDto } from '../dto/email.user.dto';

export class RegisterUserCommand {
  constructor(public readonly registerDto: EmailUserDto) {}
}
