import NodeCache from 'node-cache';

// Mock the node-cache module
jest.mock('node-cache');

// Use a real implementation of the Cache class, but mock its dependencies
const actualCache = jest.requireActual('../server/cache.js').default;

describe('Cache', () => {
  let cache;
  let mockNodeCacheInstance;

  beforeEach(() => {
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

    // Create a new instance of the actual Cache class for each test
    cache = actualCache;
    // Replace its internal NodeCache instance with our mock
    cache.cache = mockNodeCacheInstance;
  });

  test('cache should be initialized with correct options', () => {
    expect(NodeCache).toHaveBeenCalledWith({ 
      stdTTL: 300, 
      checkperiod: 60 
    });
  });

  test('get should call NodeCache get method', () => {
    const key = 'testKey';
    const value = 'testValue';
    mockNodeCacheInstance.get.mockReturnValue(value);

    const result = cache.get(key);

    expect(mockNodeCacheInstance.get).toHaveBeenCalledWith(key);
    expect(result).toBe(value);
  });

  test('set should call NodeCache set method with correct parameters', () => {
    const key = 'testKey';
    const value = 'testValue';
    const ttl = 100;

    cache.set(key, value, ttl);

    expect(mockNodeCacheInstance.set).toHaveBeenCalledWith(key, value, ttl);
  });

  test('del should call NodeCache del method', () => {
    const key = 'testKey';

    cache.del(key);

    expect(mockNodeCacheInstance.del).toHaveBeenCalledWith(key);
  });

  test('flush should call NodeCache flushAll method', () => {
    cache.flush();

    expect(mockNodeCacheInstance.flushAll).toHaveBeenCalled();
  });

  test('get should return undefined for non-existent key', () => {
    const nonExistentKey = 'nonExistentKey';
    mockNodeCacheInstance.get.mockReturnValue(undefined);

    const result = cache.get(nonExistentKey);

    expect(mockNodeCacheInstance.get).toHaveBeenCalledWith(nonExistentKey);
    expect(result).toBeUndefined();
  });

});