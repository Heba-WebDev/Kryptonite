import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock } from '../../test/mocks/prisma.mock';
import { validate } from 'class-validator';
import { userMock } from '../../test/mocks/user.mock';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('UsersService', () => {
  let userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('registering a user', () => {
    beforeEach(async () => {
      const user = {
        email: 'example@exmaple.com',
      };
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it('should register a user', async () => {
      const user = await userService.register(userMock);
      jest.spyOn(prismaMock.user, 'create');
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(user).toEqual('Registration succssfully completed');
    });

    it('should not register a user if the eamil alreadye exits', async () => {
      prismaMock.user.findFirst.mockResolvedValue(userMock);
      await expect(userService.register(userMock)).rejects.toThrow(
        new BadRequestException('Email already exsits'),
      );
    });

    it('should send a confirmation email to the user if the reginstration was succssful', async () => {
      const sent_email = await userService.confirmation_email(userMock.email);
      expect(sent_email).toBeUndefined();
    });
  });

  describe('login a user', () => {
    beforeEach(async () => {
      const user = {
        email: userMock.email,
      };
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it('should log in a user successfully', async () => {
      prismaMock.user.findFirst.mockResolvedValue(userMock);
      const result = await userService.login({ email: userMock.email });
      expect(result).toBe('A six-digit code has been sent to your email');
    });

    it('should throw an error if user not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      await expect(
        userService.login({ email: userMock.email }),
      ).rejects.toThrow(new BadRequestException('No user found'));
    });
  });

  describe('genrate OTP code', () => {
    it('should return a 6-digit code', async () => {
      const result = await userService.generate_otp(userMock.id.toString());
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(6);
      expect(typeof parseInt(result)).toBe('number');
    });
  });

  describe('verify OTP code', () => {
    const user = {
      email: userMock.email,
      code: '123456',
    };
    const createdAt = new Date();
    beforeEach(async () => {
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it('should validate code', async () => {
      prismaMock.user.findFirst.mockResolvedValue(userMock);
      prismaMock.otp.findFirst.mockResolvedValue({
        id: userMock.id,
        code: user.code,
        expires_at: new Date(createdAt.getTime() + 10 * 60 * 1000),
      });
      const result = await userService.verify_otp({
        email: userMock.email,
        code: user.code,
      });
      expect(result).toEqual('User succssfully logged in');
    });

    it('should invalidate code if it does not match the code in the db', async () => {
      prismaMock.user.findFirst.mockResolvedValue(userMock);
      prismaMock.otp.findFirst.mockResolvedValue(null);
      await expect(
        userService.verify_otp({
          email: userMock.email,
          code: 'invalid-code',
        }),
      ).rejects.toThrow(new UnauthorizedException('Wrong credientials'));
    });

    it('should throw BadRequestException for an expired OTP code', async () => {
      const otpMock = {
        id: userMock.id,
        code: user.code,
        expires_at: new Date(createdAt.getTime() - 10 * 60 * 1000),
      };

      prismaMock.user.findFirst.mockResolvedValue(userMock);
      prismaMock.otp.findFirst.mockResolvedValue(otpMock);

      await expect(
        userService.verify_otp({
          email: userMock.email,
          code: otpMock.code,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'OTP code has expired. Please genrate a new code',
        ),
      );
    });
  });

  describe('otp email', () => {
    it('should be defined and called', () => {
      expect(userService.opt_email).toBeDefined();
    });
  });

  describe('generate api key', () => {
    it('should generate a valid key', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: '',
        is_verified: true,
      };
      prismaMock.user.findFirst.mockResolvedValue(user);
      const key = Buffer.from(`${user.email}${user.id}`).toString('base64');
      const result = await userService.generate_api_key({ email: user.email });
      expect(result).toEqual({
        api_key: key,
        message:
          'Please save the api key somehwere safe. This key will not be shown again',
      });
    });

    it('should throw an error if the user is not verified', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: '',
        is_verified: false,
      };
      prismaMock.user.findFirst.mockResolvedValue(user);
      await expect(
        userService.generate_api_key({
          email: userMock.email,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });

    it('should throw an error if the user already has an api-key', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: 'gxJxwfwXZgvd=1425gs',
        is_verified: true,
      };
      prismaMock.user.findFirst.mockResolvedValue(user);
      await expect(
        userService.generate_api_key({ email: user.email }),
      ).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });

    it('should throw an error if no user with the given email was found', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: 'gxJxwfwXZgvd=1425gs',
        is_verified: true,
      };
      prismaMock.user.findFirst.mockResolvedValue(null);
      await expect(
        userService.generate_api_key({ email: user.email }),
      ).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });
  });

  describe('delete api key', () => {
    it('should delete the user current api key', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: 'xvsgwgw=ewgfwWavStwa?12f',
        is_verified: true,
      };
      prismaMock.user.findFirst.mockResolvedValue(user);
      const result = await userService.delete_api_key({ email: user.email });
      expect(result).toEqual('Api key succssfully deleted');
    });

    it('should throw an error if the user does not have a valid api key', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: '',
        is_verified: false,
      };
      prismaMock.user.findFirst.mockResolvedValue(user);
      await expect(
        userService.delete_api_key({
          email: userMock.email,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });

    it('should throw an error if no user with the given email was found', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: 'gxJxwfwXZgvd=1425gs',
        is_verified: true,
      };
      prismaMock.user.findFirst.mockResolvedValue(null);
      await expect(
        userService.generate_api_key({ email: user.email }),
      ).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });
  });
});
