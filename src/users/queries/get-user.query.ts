import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GetUserQuery {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async get(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }
}
