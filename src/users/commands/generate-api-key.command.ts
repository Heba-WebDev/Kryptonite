import { EmailUserDto } from '../dto/email.user.dto';

export class GenerateApiKeyCommand {
  constructor(public readonly apiDto: EmailUserDto) {}
}
