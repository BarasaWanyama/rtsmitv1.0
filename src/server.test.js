const axios = require('axios');
const { TextEncoder, TextDecoder } = require('util');
const request = require('supertest');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');



jest.mock('axios');
jest.mock('passport', () => {
  const originalModule = jest.requireActual('passport');
  return {
    ...originalModule,
    initialize: jest.fn(() => (req, res, next) => next()),
    session: jest.fn(() => (req, res, next) => next()),
    authenticate: jest.fn((strategy, options) => (req, res, next) => {
      req.user = { id: '123', displayName: 'Test User' };
      next();
    }),
    use: jest.fn(),
    serializeUser: jest.fn((user, done) => done(null, user.id)),
    deserializeUser: jest.fn((id, done) => done(null, { id, displayName: 'Test User' })),
  };
});

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

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'test_client_id';
process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';

// Import the app (assuming you've exported it from server.js)
const app = require('../server/server');


// Global beforeAll and afterAll
let server;
beforeAll((done) => {
  server = app.listen(done);
});

afterAll((done) => {
  mongoose.connection.close();
  server.close(done);
});

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Server', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to the API');
  });

  test('GET /auth/google should redirect to Google', async () => {
    const response = await request(app).get('/auth/google');
    expect(response.status).toBe(302);
    expect(response.header.location).toContain('accounts.google.com');
  });

  test('GET /auth/google/callback should handle Google callback', async () => {
    const response = await request(app)
      .get('/auth/google/callback')
      .set('user', JSON.stringify({ id: '123', displayName: 'Test User' }));
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(process.env.FRONTEND_URL);
  });

  test('GET /auth/user should return user if authenticated', async () => {
    const response = await request(app)
      .get('/auth/user')
      .set('user', JSON.stringify({ id: '123', displayName: 'Test User' }));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: '123', displayName: 'Test User' });
  });

  test('GET /auth/user should return 401 if not authenticated', async () => {
    const response = await request(app).get('/auth/user');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Not authenticated' });
  });

  test('POST /auth/logout should log out the user', async () => {
    const response = await request(app)
      .post('/auth/logout')
      .set('Cookie', ['connect.sid=test-session-id']);
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Logged out successfully' });
  });

});
  
describe('Social Media Data API', () => {
  beforeEach(() => {
    const mockData = {
      facebook: { posts: [{ id: 1, content: 'Facebook post' }] },
      linkedin: { posts: [{ id: 2, content: 'LinkedIn post' }] },
      platformX: { posts: [{ id: 3, content: 'Platform X post' }] }
    };
  
    axios.get.mockImplementation((url) => {
      if (url.includes('facebook')) return Promise.resolve({ data: mockData.facebook });
      if (url.includes('linkedin')) return Promise.resolve({ data: mockData.linkedin });
      if (url.includes('platform-x')) return Promise.resolve({ data: mockData.platformX });
      return Promise.reject(new Error('Invalid URL'));
    });
  });

  test('GET /api/social-media-data should return aggregated data if authenticated', async () => {
    const response = await request(app)
      .get('/api/social-media-data')
      .set('Cookie', ['connect.sid=test-session-id']);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { platform: 'Facebook', data: { posts: [{ id: 1, content: 'Facebook post' }] } },
      { platform: 'LinkedIn', data: { posts: [{ id: 2, content: 'LinkedIn post' }] } },
      { platform: 'Platform X', data: { posts: [{ id: 3, content: 'Platform X post' }] } }
    ]);
  });

  test('GET /api/social-media-data should return 401 if not authenticated', async () => {
    const response = await request(app).get('/api/social-media-data');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Not authenticated' });
  });

  test('GET /api/social-media-data should handle errors', async () => {
    axios.get.mockRejectedValueOnce(new Error('API error'));

    const response = await request(app)
      .get('/api/social-media-data')
      .set('Cookie', ['connect.sid=test-session-id']);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to fetch social media data',
      details: 'API error'
    });
  });
  // Add more tests for other routes (e.g., /api/items, /api/social-media-posts)
});