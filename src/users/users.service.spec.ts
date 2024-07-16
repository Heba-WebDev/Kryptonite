/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { OTP } from '../entities/otp.entity';
import { Repository } from 'typeorm';
import { validate } from 'class-validator';
import { userMock } from '../../test/mocks/user.mock';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let otpRepository: Repository<OTP>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OTP),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    otpRepository = module.get<Repository<OTP>>(getRepositoryToken(OTP));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      const result = await service.register({
        email: 'example@example.com',
      });

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result).toEqual('Registration succssfully completed');
    });

    it('should not register a user if the eamil alreadye exits', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userMock);
      await expect(service.register(userMock)).rejects.toThrow(
        new ConflictException('Email already exsits'),
      );
    });

    it('should send a confirmation email to the user if the reginstration was succssful', async () => {
      const sent_email = await service.confirmation_email(userMock.email);
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
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userMock);
      const result = await service.login({ email: userMock.email });
      expect(result).toBe('A six-digit code has been sent to your email');
    });

    it('should throw an error if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(service.login({ email: userMock.email })).rejects.toThrow(
        new BadRequestException('No user found'),
      );
    });
  });

  describe('generate OTP code', () => {
    it('should return a 6-digit code', async () => {
      const result = await service.generate_otp(userMock);
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(6);
      expect(typeof parseInt(result)).toBe('number');
    });
  });

  describe('verify OTP code', () => {
    const now = new Date();
    const user = {
      id: userMock.id,
      email: userMock.email,
      code: '123456',
      created_at: now,
      expires_at: new Date(now.getTime() + 10 * 60 * 1000),
      user: userMock,
      setExpirationDate: jest.fn(),
    };
    const createdAt = new Date();
    beforeEach(async () => {
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it('should validate code', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userMock);
      jest.spyOn(otpRepository, 'findOne').mockResolvedValue(user);
      const result = await service.verify_otp({
        email: userMock.email,
        code: user.code,
      });
      expect(result).toEqual('User succssfully logged in');
    });

    it('should invalidate code if it does not match the code in the db', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userMock);
      jest.spyOn(otpRepository, 'findOne').mockResolvedValue(null);
      await expect(
        service.verify_otp({
          email: userMock.email,
          code: 'invalid-code',
        }),
      ).rejects.toThrow(new UnauthorizedException('Wrong credientials'));
    });

    it('should throw BadRequestException for an expired OTP code', async () => {
      const otpMock = {
        id: userMock.id,
        created_at: user.created_at,
        code: user.code,
        expires_at: new Date(createdAt.getTime() - 10 * 60 * 1000),
        user: userMock,
        setExpirationDate: jest.fn(),
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userMock);
      jest.spyOn(otpRepository, 'findOne').mockResolvedValue(otpMock);

      await expect(
        service.verify_otp({
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
      expect(service.opt_email).toBeDefined();
    });
  });

  describe('generate api key', () => {
    it('should generate a valid key', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: '',
        is_verified: true,
        files: [],
        otp: [],
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      const key = Buffer.from(`${user.email}${user.id}`).toString('base64');
      const result = await service.generate_api_key({ email: user.email });
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
        files: [],
        otp: [],
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      await expect(
        service.generate_api_key({
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
        files: [],
        otp: [],
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      await expect(
        service.generate_api_key({ email: user.email }),
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
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(
        service.generate_api_key({ email: user.email }),
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
        files: [],
        otp: [],
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      const result = await service.delete_api_key({ email: user.email });
      expect(result).toEqual('Api key succssfully deleted');
    });

    it('should throw an error if the user does not have a valid api key', async () => {
      const user = {
        id: userMock.id,
        email: userMock.email,
        api_key: '',
        is_verified: false,
        files: [],
        otp: [],
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      await expect(
        service.delete_api_key({
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
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(
        service.generate_api_key({ email: user.email }),
      ).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });
  });
});
