import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  providers: [FilesService, PrismaService, UsersService, CloudinaryProvider],
  controllers: [FilesController],
})
export class FilesModule {}
