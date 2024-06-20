const mockFile: Express.Multer.File = {
  fieldname: 'image',
  originalname: 'example.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 1024,
  buffer: Buffer.from('dummy file content'),
  stream: null,
  destination: '',
  filename: 'example.jpg',
  path: '/path/to/uploaded/file',
};

export { mockFile };
