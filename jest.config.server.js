export default {
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.js', '!<rootDir>/src/**/*.server.test.js'],
      moduleNameMapper: {
        '^cors$': '<rootDir>/src/__mocks__/corsMock.js',
        '^passport-google-oauth20$': '<rootDir>/src/__mocks__/passportGoogleOauth20Mock.js'
      }
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.server.test.js'],
      moduleFileExtensions: ['js', 'json', 'node'],
      transform: {'^.+\\.js$': 'babel-jest',},
      transformIgnorePatterns: [
        '/node_modules/(?!axios)/'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.server.js'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^axios$': '<rootDir>/node_modules/axios/dist/node/axios.cjs'
      }
    }
  ]
};