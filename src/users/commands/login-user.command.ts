import { EmailUserDto } from '../dto/email.user.dto';

export class LoginUserCommand {
  constructor(public readonly dto: EmailUserDto) {}
}
