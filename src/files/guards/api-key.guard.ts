import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { FilesService } from '../files.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['X-API-KEY'] || req.headers['x-api-key'];
    if (!apiKey) {
      throw new UnauthorizedException('Unauthorized to perform this action');
    }
    req.body.api_key = apiKey;
    req.api_key = apiKey;
    await this.filesService.isValidKey(apiKey);
    return true;
  }
}
