import { IsEmail } from 'class-validator';

export class EmailUserDto {
  @IsEmail()
  readonly email: string;
}
