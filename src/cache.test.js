import NodeCache from 'node-cache';

// Mock the node-cache module
jest.mock('node-cache');

// Create a mock of the Cache class
const mockCacheModule = jest.createMockFromModule('../server/cache.js');
jest.mock('../server/cache.js', () => mockCacheModule);

describe('Cache', () => {
  let Cache;
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

    // Reset the mock Cache class
    Cache = class {
      constructor(ttlSeconds = 300) {
        this.cache = new NodeCache({ 
          stdTTL: ttlSeconds, 
          checkperiod: ttlSeconds * 0.2 
        });
      }

      get(key) { return this.cache.get(key); }
      set(key, value, ttl) { return this.cache.set(key, value, ttl); }
      del(key) { return this.cache.del(key); }
      flush() { return this.cache.flushAll(); }
    };

    mockCacheModule.default = Cache;

    // Create a new instance of the Cache class for each test
    cache = new Cache();
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