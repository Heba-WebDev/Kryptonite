import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { OTP } from 'src/entities/otp.entity';
import { File } from 'src/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, OTP, File])],
  providers: [FilesService, PrismaService, UsersService, CloudinaryProvider],
  controllers: [FilesController],
})
export class FilesModule {}
