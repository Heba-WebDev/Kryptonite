import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock } from '../../test/mocks/prisma.mock';
import { validate } from 'class-validator';
import { userMock } from '../../test/mocks/user.mock';
import { BadRequestException } from '@nestjs/common';

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
      const errors = await validate(userMock);
      expect(errors).toHaveLength(0);
    });

    it('should register a user', async () => {
      const user = await userService.register(userMock);
      expect(prismaMock.user.create).toHaveBeenCalled();
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
      const errors = await validate(userMock);
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
});
