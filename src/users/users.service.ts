import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { EmailUserDto } from './dto/email.user.dto';
import { VerifyOtpDto } from './dto/otp.user.dto';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { OTP } from '../entities/otp.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OTP)
    private readonly otpRepository: Repository<OTP>,
  ) {}

  async register(registerDto: EmailUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: registerDto.email,
      },
    });
    if (user) throw new ConflictException('Email already exsits');
    const newUser = await this.userRepository.create({
      email: registerDto.email,
    });
    await this.userRepository.save(newUser);
    this.confirmation_email(registerDto.email);
    return 'Registration succssfully completed';
  }

  async login(loginDto: EmailUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: loginDto.email,
      },
    });
    if (!user) throw new BadRequestException('No user found');
    const code = await this.generate_otp(user);
    this.opt_email(loginDto.email, code);
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

  async verify_otp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: verifyOtpDto.email,
      },
    });
    if (!user) throw new BadRequestException('No user found');
    const code = await this.otpRepository.findOne({
      where: {
        user: user,
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
      user.is_verified = true;
      await this.userRepository.save(user);
    }
    return 'User succssfully logged in';
  }

  async generate_api_key(email: EmailUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: email.email,
      },
    });
    if (!user || !user.is_verified || user.api_key)
      throw new UnauthorizedException('Unauthorized to perform this action');
    const key = Buffer.from(`${email.email}${user.id}`).toString('base64');
    user.api_key = key;
    await this.userRepository.save(user);
    return {
      api_key: key,
      message:
        'Please save the api key somehwere safe. This key will not be shown again',
    };
  }

  async delete_api_key(email: EmailUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: email.email,
      },
    });
    if (!user || !user.api_key)
      throw new UnauthorizedException('Unauthorized to perform this action');
    user.api_key = '';
    await this.userRepository.save(user);
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
