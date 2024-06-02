export const userServiceMock = {
  register: jest.fn(),
  login: jest.fn(),
  generate_otp: jest.fn(),
  verify_otp: jest.fn(),
  generate_api_key: jest.fn(),
  delete_api_key: jest.fn(),
  confirmation_email: jest.fn(),
  opt_email: jest.fn(),
};
