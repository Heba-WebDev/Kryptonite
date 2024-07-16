import { User } from 'src/entities/user.entity';

export const userMock: User = {
  id: 'randomUUID',
  email: 'example@exmaple.com',
  api_key: '' || 'sfssgs',
  is_verified: true || false,
  files: [],
  otp: [],
};
