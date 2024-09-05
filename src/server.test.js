jest.mock('axios');
const axios = require('axios');

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


const request = require('supertest');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const axios = require('axios');


// Mock external dependencies
jest.mock('passport');
jest.mock('mongoose');

// Import the app (assuming you've exported it from server.js)
const app = require('../server/server');

describe('Server', () => {
  beforeAll(() => {
    // Mock passport functions
    passport.use = jest.fn();
    passport.serializeUser = jest.fn();
    passport.deserializeUser = jest.fn();
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
    expect(response.status).toBe(302); // Redirect status code
    expect(response.header.location).toContain('accounts.google.com');
  });

  test('GET /auth/google/callback should handle Google callback', async () => {
    passport.authenticate.mockImplementation((strategy, options) => {
      return (req, res, next) => {
        req.user = { id: '123', displayName: 'Test User' };
        next();
      };
    });

    const response = await request(app).get('/auth/google/callback');
    expect(response.status).toBe(302); // Redirect status code
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
    const mockLogout = jest.fn((callback) => callback());
    const response = await request(app)
      .post('/auth/logout')
      .set('user', JSON.stringify({ id: '123', displayName: 'Test User' }))
      .set('logout', mockLogout);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Logged out successfully' });
    expect(mockLogout).toHaveBeenCalled();
  });

  test('GET /api/social-media-data should return aggregated data if authenticated', async () => {
    const mockData = {
      facebook: { posts: [{ id: 1, content: 'Facebook post' }] },
      linkedin: { posts: [{ id: 2, content: 'LinkedIn post' }] },
      platformX: { posts: [{ id: 3, content: 'Platform X post' }] }
    };

    axios.get
      .mockResolvedValueOnce({ data: mockData.facebook })
      .mockResolvedValueOnce({ data: mockData.linkedin })
      .mockResolvedValueOnce({ data: mockData.platformX });

    const response = await request(app)
      .get('/api/social-media-data')
      .set('user', JSON.stringify({ id: '123', displayName: 'Test User' }));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { platform: 'Facebook', data: mockData.facebook },
      { platform: 'LinkedIn', data: mockData.linkedin },
      { platform: 'Platform X', data: mockData.platformX }
    ]);
  });

  test('GET /api/social-media-data should return 401 if not authenticated', async () => {
    const response = await request(app).get('/api/social-media-data');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Not authenticated' });
  });

  test('GET /api/social-media-data should handle errors', async () => {
    axios.get.mockRejectedValue(new Error('API error'));

    const response = await request(app)
      .get('/api/social-media-data')
      .set('user', JSON.stringify({ id: '123', displayName: 'Test User' }));

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Failed to fetch social media data',
      details: 'API error'
    });
  });

  // Add more tests for other routes (e.g., /api/items, /api/social-media-posts)
});