import NodeCache from 'node-cache';

// Mock NodeCache
jest.mock('node-cache');

// Mock the cache module
jest.mock('../server/cache.js', () => {
  // Create a mock Cache instance
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flush: jest.fn()
  };
  return { __esModule: true, default: mockCache };
});

// Import the mocked cache instance
import cacheInstance from '../server/cache.js';

describe('Cache', () => {
  let mockNodeCacheInstance;
  let mockGet, mockSet, mockDel, mockFlushAll;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a mock NodeCache instance
    mockNodeCacheInstance = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn()
    };
    // Make the NodeCache constructor return our mock instance
    NodeCache.mockImplementation(() => mockNodeCacheInstance);

    // Replace the cache property of our mocked cacheInstance
    cacheInstance.cache = mockNodeCacheInstance;
  });

  test('cache should be initialized with correct options', () => {
    // This test assumes the Cache is created with default options
    expect(NodeCache).toHaveBeenCalledWith({ 
      stdTTL: 300, 
      checkperiod: 60 
    });
  });

  test('get should call NodeCache get method', () => {
    const key = 'testKey';
    const value = 'testValue';
    mockNodeCacheInstance.get.mockReturnValue(value);

    const result = cacheInstance.get(key);

    expect(mockNodeCacheInstance.get).toHaveBeenCalledWith(key);
    expect(result).toBe(value);
  });

  test('set should call NodeCache set method with correct parameters', () => {
    const key = 'testKey';
    const value = 'testValue';
    const ttl = 100;

    cacheInstance.set(key, value, ttl);

    expect(mockNodeCacheInstance.set).toHaveBeenCalledWith(key, value, ttl);
  });

  test('del should call NodeCache del method', () => {
    const key = 'testKey';

    cacheInstance.del(key);

    expect(mockNodeCacheInstance.del).toHaveBeenCalledWith(key);
  });

  test('flush should call NodeCache flushAll method', () => {
    cacheInstance.flush();

    expect(mockNodeCacheInstance.flushAll).toHaveBeenCalled();
  });

  test('get should return undefined for non-existent key', () => {
    const nonExistentKey = 'nonExistentKey';
    mockNodeCacheInstance.get.mockReturnValue(undefined);
  
    const result = cacheInstance.get(nonExistentKey);
  
    expect(mockNodeCacheInstance.get).toHaveBeenCalledWith(nonExistentKey);
    expect(result).toBeUndefined();
  });

});