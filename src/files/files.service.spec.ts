import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock } from '../../test/mocks/prisma.mock';
import { mockFile } from '../../test/mocks/file.mock';
import { UnauthorizedException } from '@nestjs/common';
import { userMock } from '../../test/mocks/user.mock';

describe('FilesService', () => {
  let filesService: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    filesService = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(filesService).toBeDefined();
  });

  describe('upload a file', () => {
    it('should throw UnauthorizedException for an invalid user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        filesService.upload('invalid-api-key', mockFile),
      ).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });
  });

  describe('isValidApiKey', () => {
    it('should return true', async () => {
      prismaMock.user.findFirst.mockReturnValue(userMock);
      const result = await filesService.isValidKey(userMock.api_key);
      expect(result).toEqual(true);
    });
    it('should thorw unauthorized exception', async () => {
      prismaMock.user.findFirst.mockReturnValue(null);
      await expect(filesService.isValidKey('invalid-key')).rejects.toThrow(
        new UnauthorizedException('Unauthorized to perform this action'),
      );
    });
  });

  describe('find all files of a user', () => {
    it('should return all files', async () => {
      const arrFiles = [
        {
          id: '1',
          url: 'http://test.com/img1',
          user_id: 'user1',
        },
        {
          id: '2',
          url: 'http://test.com/img2',
          user_id: 'user1',
        },
      ];
      prismaMock.user.findFirst.mockResolvedValue(userMock);
      prismaMock.files.findMany.mockResolvedValue(arrFiles);
      const result = await filesService.allFiles(userMock.api_key);
      expect(result).toEqual({ files: arrFiles });
    });
  });
});
