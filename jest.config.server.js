module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.js'],
  moduleFileExtensions: ['js', 'json', 'node'],
  transform: {},
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  setupFilesAfterEnv: ['./jest.setup.server.js']
};