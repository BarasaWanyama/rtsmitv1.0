export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.server.test.js'],
  moduleFileExtensions: ['js', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!axios)/'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.server.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};