import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

import {jest} from '@jest/globals';
import axios from 'axios';
import passport from 'passport';
import session from 'express-session';
import cors from 'cors';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';


jest.mock('axios');
jest.mock('passport');
jest.mock('express-session');
jest.mock('cors');
jest.mock('passport-google-oauth20');
jest.mock('mongoose');

beforeAll(() => {
  // Mock axios
  axios.get.mockImplementation(() => Promise.resolve({ data: {} }));
  axios.post.mockImplementation(() => Promise.resolve({ data: {} }));

  // Mock passport
  passport.initialize.mockImplementation(() => (req, res, next) => next());
  passport.session.mockImplementation(() => (req, res, next) => next());
  passport.authenticate.mockImplementation(() => (req, res, next) => {
    req.user = { id: '123', displayName: 'Test User' };
    next();
  });
  passport.use.mockImplementation(() => {});
  passport.serializeUser.mockImplementation((user, done) => done(null, user));
  passport.deserializeUser.mockImplementation((obj, done) => done(null, obj));

  // Mock express-session
  jest.mocked(session).mockImplementation(() => (req, res, next) => {
    req.session = {};
    next();
  });

  // Mock cors
  jest.mocked(cors).mockImplementation(() => (req, res, next) => next());

  // Mock GoogleStrategy
  jest.mocked(GoogleStrategy).mockImplementation((options, verifyFunction) => ({
    name: 'google',
    authenticate: jest.fn((req, options) => {
      const user = { id: '123', displayName: 'Test User' };
      verifyFunction(null, null, user, null);
    }),
  }));


  // Define mock functions for mongoose connection
  const mockConnect = jest.fn();
  const mockOn = jest.fn();
  const mockClose = jest.fn();

  // Mock mongoose
  mongoose.connect.mockImplementation(() => Promise.resolve());
  mongoose.connect.mockImplementation(mockConnect);
  mongoose.connection.on.mockImplementation(mockOn);
  mongoose.connection.close.mockImplementation(mockClose);
  mongoose.model.mockImplementation(() => ({}));
  mongoose.Schema.mockImplementation(() => ({}));
});

// Set up environment variables for testing
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'test_client_id';
process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';
process.env.SESSION_SECRET = 'test_session_secret';
process.env.MONGODB_URI = 'mongodb://testdb/testdb';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import the app after setting up mocks and environment variables
import app from '../server/server.js';

// Helper function for authenticated requests
const authenticatedRequest = (request) => {
  const authenticatedUser = { id: '123', displayName: 'Test User' };
  return request.set('user', JSON.stringify(authenticatedUser));
};

describe('Server', () => {
  let server;

  beforeAll((done) => {
    // Mock successful database connection
    mockConnect.mockResolvedValue(undefined);
    mockOn.mockImplementation((event, callback) => {
      if (event === 'connected') {
        callback();
      }
    });

    server = app.listen(done);
  });

  afterAll((done) => {
    mockClose.mockImplementation((callback) => callback());
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
  
  test('GET /api/items should return items if authenticated', async () => {
    const mockItems = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];
    
    // Mock the items route handler
    app.get('/api/items', (req, res) => {
      res.json(mockItems);
    });

    const response = await authenticatedRequest(request(app).get('/api/items'));
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockItems);
  });

  test('GET /api/items should return 401 if not authenticated', async () => {
    const response = await request(app).get('/api/items');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Not authenticated' });
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