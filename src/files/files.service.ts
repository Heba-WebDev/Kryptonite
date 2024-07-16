/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { Repository } from 'typeorm';
import { File } from '../entities/file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async upload(key: string, file: Express.Multer.File) {
    const user = await this.userRepository.findOne({
      where: {
        api_key: key,
      },
    });
    if (!user)
      throw new UnauthorizedException('Unauthorized to perform this action');
    const uploadResult = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
    const uploadedFile = this.fileRepository.create({
      url: uploadResult,
      user: user,
    });
    await this.fileRepository.save(uploadedFile);

    return 'Image successfully uploaded';
  }

  async allFiles(api_key: string) {
    const user = await this.userRepository.findOne({
      where: {
        api_key,
      },
    });
    if (!user)
      throw new UnauthorizedException('Unauthorized to perform this action');
    const files = await this.fileRepository.find({
      where: {
        user,
      },
    });
    if (!files || files.length === 0)
      throw new NotFoundException('No images found');

    return { files };
  }

  async isValidKey(api_key: string) {
    const user = await this.userRepository.findOne({
      where: {
        api_key,
      },
    });
    if (!user)
      throw new UnauthorizedException('Unauthorized to perform this action');
    return true;
  }
}
