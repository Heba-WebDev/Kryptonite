import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(key: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findFirst({
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

    await this.prisma.files.create({
      data: {
        url: uploadResult,
        user_id: user.id,
      },
    });

    return 'Image successfully uploaded';
  }

  async allFiles(api_key: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        api_key,
      },
    });
    if (!user)
      throw new UnauthorizedException('Unauthorized to perform this action');

    const files = await this.prisma.files.findMany({
      where: {
        user_id: user.id,
      },
    });

    if (!files) throw new NotFoundException('No images found');

    return { files };
  }

  async isValidKey(api_key: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        api_key,
      },
    });
    if (!user)
      throw new UnauthorizedException('Unauthorized to perform this action');
    return true;
  }
}
