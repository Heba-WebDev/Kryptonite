import { VerifyOtpDto } from '../dto/otp.user.dto';

export class VerifyOtpCommand {
  constructor(public readonly otpDto: VerifyOtpDto) {}
}
