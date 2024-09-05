jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    // Add other methods you use
  },
}));
const axios = require('axios');

const { populateCache } = require('../server/cachePopulator');
const Cache = require('../server/cache');


// Mock the cache module
jest.mock('../server/cache', () => ({
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  flush: jest.fn(),
}));

describe('cachePopulator', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('populateCache should generate synthetic data for all platforms', () => {
    populateCache();

    // Check if cache.set was called with the correct arguments
    expect(cache.set).toHaveBeenCalledWith('social_media_data', expect.any(Array), 3600);

    // Get the synthetic data passed to cache.set
    const syntheticData = cache.set.mock.calls[0][1];

    // Check if synthetic data was generated for all platforms
    expect(syntheticData).toHaveLength(3);
    expect(syntheticData.map(item => item.platform)).toEqual(['Facebook', 'LinkedIn', 'Platform X']);
  });

  test('each platform should have the correct data structure', () => {
    populateCache();

    const syntheticData = cache.set.mock.calls[0][1];

    syntheticData.forEach(platformData => {
      expect(platformData).toHaveProperty('platform');
      expect(platformData).toHaveProperty('data');
      expect(platformData.data).toHaveProperty('posts');
      expect(platformData.data).toHaveProperty('totalEngagement');
      expect(platformData.data).toHaveProperty('topPost');
    });
  });

  test('each platform should have 10 posts', () => {
    populateCache();

    const syntheticData = cache.set.mock.calls[0][1];

    syntheticData.forEach(platformData => {
      expect(platformData.data.posts).toHaveLength(10);
    });
  });

  test('posts should have the correct structure', () => {
    populateCache();

    const syntheticData = cache.set.mock.calls[0][1];

    syntheticData.forEach(platformData => {
      platformData.data.posts.forEach(post => {
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('text');
        expect(post).toHaveProperty('likes');
        expect(post).toHaveProperty('shares');
        expect(post).toHaveProperty('date');
        expect(post).toHaveProperty('topic');
      });
    });
  });

  test('totalEngagement should be the sum of likes and shares', () => {
    populateCache();

    const syntheticData = cache.set.mock.calls[0][1];

    syntheticData.forEach(platformData => {
      const calculatedEngagement = platformData.data.posts.reduce((sum, post) => sum + post.likes + post.shares, 0);
      expect(platformData.data.totalEngagement).toBe(calculatedEngagement);
    });
  });

  test('topPost should be the post with the most likes', () => {
    populateCache();

    const syntheticData = cache.set.mock.calls[0][1];

    syntheticData.forEach(platformData => {
      const actualTopPost = platformData.data.topPost;
      const expectedTopPost = platformData.data.posts.reduce((top, post) => post.likes > top.likes ? post : top, platformData.data.posts[0]);
      expect(actualTopPost).toEqual(expectedTopPost);
    });
  });

  test('post ids should be unique and follow the correct format', () => {
    populateCache();

    const syntheticData = cache.set.mock.calls[0][1];

    syntheticData.forEach(platformData => {
      const ids = new Set();
      platformData.data.posts.forEach(post => {
        expect(post.id).toMatch(new RegExp(`^${platformData.platform.toLowerCase()}_post_\\d+$`));
        expect(ids.has(post.id)).toBeFalsy();
        ids.add(post.id);
      });
    });
  });

  test('post dates should be within the last 7 days', () => {
    populateCache();

    const syntheticData = cache.set.mock.calls[0][1];
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    syntheticData.forEach(platformData => {
      platformData.data.posts.forEach(post => {
        const postDate = new Date(post.date).getTime();
        expect(postDate).toBeGreaterThanOrEqual(sevenDaysAgo);
        expect(postDate).toBeLessThanOrEqual(now);
      });
    });
  });

  test('post topics should be one of Technology, Business, or Entertainment', () => {
    populateCache();

    const syntheticData = cache.set.mock.calls[0][1];
    const validTopics = ['Technology', 'Business', 'Entertainment'];

    syntheticData.forEach(platformData => {
      platformData.data.posts.forEach(post => {
        expect(validTopics).toContain(post.topic);
      });
    });
  });
});