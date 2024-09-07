module.exports = {
    testEnvironment: 'node',
    transform: {
      '^.+\\.jsx?$': 'babel-jest'
    },
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
    testMatch: ['**/tests/**/*.js', '**/?(*.)+(spec|test).js'],
    testPathIgnorePatterns: ['/node_modules/', '/build/'],
    setupFilesAfterEnv: ['./jest.setup.js']
  };