import { Body, Controller, Post, Delete } from '@nestjs/common';
import { EmailUserDto } from './dto/email.user.dto';
import { UsersService } from './users.service';
import { VerifyOtpDto } from './dto/otp.user.dto';
import { ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from './commands/register-user.command';
import { LoginUserCommand } from './commands/login-user.command';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly authService: UsersService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('/register')
  async register(@Body() registerDto: EmailUserDto) {
    return this.commandBus.execute(new RegisterUserCommand(registerDto));
  }

  @Post('/login')
  async login(@Body() loginDto: EmailUserDto) {
    return this.commandBus.execute(new LoginUserCommand(loginDto));
  }

  @Post('/verify-otp')
  async otp(@Body() otpDto: VerifyOtpDto) {
    return this.authService.verify_otp(otpDto);
  }

  @Post('/api-key')
  async apiKey(@Body() apiDto: EmailUserDto) {
    return this.authService.generate_api_key(apiDto);
  }

  @Delete('/api-key')
  async deleteApiKey(@Body() apiDto: EmailUserDto) {
    return this.authService.delete_api_key(apiDto);
  }
}
