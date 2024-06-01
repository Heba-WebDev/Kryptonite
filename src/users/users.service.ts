import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createTransport } from 'nodemailer';
import { EmailUserDto } from './dto/email.user.dto';
import { VerifyOtpDto } from './dto/otp.user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(registerDto: EmailUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: registerDto.email,
      },
    });
    if (user) throw new BadRequestException('Email already exsits');
    await this.prisma.user.create({
      data: {
        email: registerDto.email,
      },
    });
    this.confirmation_email(registerDto.email);
    return 'Registration succssfully completed';
  }

  async login(loginDto: EmailUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email,
      },
    });
    if (!user) throw new BadRequestException('No user found');
    const code = await this.generate_otp(user.id);
    this.opt_email(loginDto.email, code);
    return 'A six-digit code has been sent to your email';
  }

  async generate_otp(user_id: string) {
    const min = 100000;
    const max = 999999;
    const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
    const createdAt = new Date();
    const expirationDate = new Date(createdAt.getTime() + 10 * 60 * 1000);
    await this.prisma.otp.create({
      data: {
        user_id: user_id,
        code: randomCode.toString(),
        created_at: createdAt,
        expires_at: expirationDate,
      },
    });
    return randomCode.toString();
  }

  async verify_otp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: verifyOtpDto.email,
      },
    });
    if (!user) throw new BadRequestException('No user found');
    const code = await this.prisma.otp.findFirst({
      where: {
        user_id: user.id,
        code: verifyOtpDto.code,
      },
    });
    if (!code) throw new UnauthorizedException('Wrong credientials');
    const date = new Date();
    if (date > code.expires_at)
      throw new BadRequestException(
        'OTP code has expired. Please genrate a new code',
      );
    if (!user.is_verified) {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          is_verified: true,
        },
      });
    }
    return 'User succssfully logged in';
  }

  async generate_api_key(email: EmailUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.email,
      },
    });
    if (!user || !user.is_verified || user.api_key)
      throw new UnauthorizedException('Unauthorized to perform this action');
    const key = Buffer.from(`${email.email}${user.id}`).toString('base64');
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        api_key: key,
      },
    });
    return {
      api_key: key,
      message:
        'Please save the api key somehwere safe. This key will not be shown again',
    };
  }

  async delete_api_key(email: EmailUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.email,
      },
    });
    if (!user || !user.api_key)
      throw new UnauthorizedException('Unauthorized to perform this action');
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        api_key: '',
      },
    });
    return 'Api key succssfully deleted';
  }

  async confirmation_email(email: string) {
    const transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USR,
      to: email,
      subject: 'Registration Confirmation | Kryptonite',
      text: `Welcome to Kryptonite App! Your registration has been successfully completed. By default an 2FA authnteication process is turned on. Every time you log in, a six-digit code will be send to this email.`,
    };
    if (process.env.NODE_ENV !== 'test') {
      transporter.sendMail(mailOptions, async (error) => {
        if (error) {
          throw new ServiceUnavailableException(
            'An error occured while sending the confirmation email',
          );
        }
      });
    }
  }

  async opt_email(email: string, code: string) {
    const transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USR,
      to: email,
      subject: 'OTP Code | Kryptonite',
      text: `Thank you for using Kryptonite. Here is your one-time login code: ${code}`,
    };
    if (process.env.NODE_ENV !== 'test') {
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          throw new ServiceUnavailableException(
            'An error occured while sending the OTP code',
          );
        }
      });
    }
  }
}
