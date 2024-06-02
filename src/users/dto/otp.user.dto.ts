import { IsEmail, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: '123456',
    description: 'The six-digits code sent to the user via their email',
    nullable: false,
  })
  @Length(6, 6)
  code: string;

  @ApiProperty({
    example: 'test@example.com',
    description: 'The email of the user',
    nullable: false,
  })
  @IsEmail()
  email: string;
}
