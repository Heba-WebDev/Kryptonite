import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock } from '../../test/mocks/prisma.mock';
import { userMock } from '../../test/mocks/user.mock';
import { userServiceMock } from '../../test/mocks/userService.mock';
import { EmailUserDto } from './dto/email.user.dto';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: userServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('create => should create a new user by a given data', async () => {
      const user = {
        email: userMock.email,
      } as EmailUserDto;

      jest.spyOn(userServiceMock, 'register').mockReturnValue(user);

      const result = await controller.register(user);

      expect(userServiceMock.register).toHaveBeenCalled();
      expect(userServiceMock.register).toHaveBeenCalledWith(user);

      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {});
  });
});
