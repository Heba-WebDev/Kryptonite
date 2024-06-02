import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailUserDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'The email of the user',
    nullable: false,
  })
  @IsEmail()
  readonly email: string;
}
