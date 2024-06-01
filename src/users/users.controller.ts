import { Body, Controller, Post, Delete } from '@nestjs/common';
import { EmailUserDto } from './dto/email.user.dto';
import { UsersService } from './users.service';
import { VerifyOtpDto } from './dto/otp.user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: UsersService) {}

  @Post('/register')
  async register(@Body() registerDto: EmailUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  async login(@Body() loginDto: EmailUserDto) {
    return this.authService.login(loginDto);
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
