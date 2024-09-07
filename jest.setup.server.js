const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('axios');
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  authenticate: jest.fn((strategy, options) => (req, res, next) => {
    req.user = { id: '123', displayName: 'Test User' };
    next();
  }),
  use: jest.fn(),
  serializeUser: jest.fn((user, done) => done(null, user.id)),
  deserializeUser: jest.fn((id, done) => done(null, { id, displayName: 'Test User' })),
}));

jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
    once: jest.fn(),
  },
  model: jest.fn(),
  Schema: jest.fn(),
}));

jest.mock('express-session', () => {
  return jest.fn(() => (req, res, next) => {
    req.session = {};
    req.session.destroy = jest.fn(callback => callback());
    next();
  });
});

// Mock environment variables
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'test_client_id';
process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';