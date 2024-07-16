import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock } from '../../test/mocks/prisma.mock';
import { mockFile } from '../../test/mocks/file.mock';
import { UnauthorizedException } from '@nestjs/common';
import { userMock } from '../../test/mocks/user.mock';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { OTP } from '../entities/otp.entity';
import { File } from '../entities/file.entity';
import { Repository } from 'typeorm';

describe('FilesService', () => {
  let filesService: FilesService;
  let userRepository: Repository<User>;
  let fileRepository: Repository<File>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
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
        {
          provide: getRepositoryToken(File),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    filesService = module.get<FilesService>(FilesService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    fileRepository = module.get<Repository<File>>(getRepositoryToken(File));
  });

  it('should be defined', () => {
    expect(filesService).toBeDefined();
  });

  describe('upload a file', () => {
    it('should throw UnauthorizedException for an invalid user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        filesService.upload('invalid-api-key', mockFile),
      ).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });
  });

  describe('isValidApiKey', () => {
    it('should return true', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userMock);
      const result = await filesService.isValidKey(userMock.api_key);
      expect(result).toEqual(true);
    });
    it('should thorw unauthorized exception', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(filesService.isValidKey('invalid-key')).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });
  });

  describe('find all files of a user', () => {
    it('should return all files', async () => {
      const arrFiles: File[] = [
        {
          id: '1',
          url: 'http://test.com/img1',
          user: userMock,
        },
      ];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userMock);
      jest.spyOn(fileRepository, 'find').mockResolvedValue(arrFiles);

      const result = await filesService.allFiles(userMock.api_key);
      expect(result).toEqual({ files: arrFiles });
    });
  });
});
