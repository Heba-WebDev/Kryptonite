import {
  Controller,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  Post,
  UseGuards,
  Body,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiKeyGuard } from './guards/api-key.guard';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(FileInterceptor('image'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'image/(jpg|jpeg|png|svg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('api_key') api_key: string,
  ) {
    return await this.filesService.upload(api_key, file);
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  async allFiles(@Body('api_key') api_key: string) {
    return await this.filesService.allFiles(api_key);
  }
}
