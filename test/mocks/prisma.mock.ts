export const prismaMock = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  otp: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
};
