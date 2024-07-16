import { EmailUserDto } from '../dto/email.user.dto';

export class DeleteApiKeyCommand {
  constructor(public readonly apiDto: EmailUserDto) {}
}
