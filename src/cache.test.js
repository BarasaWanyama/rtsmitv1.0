import NodeCache from 'node-cache';
import cacheInstance from '../server/cache.js'; // Import the cache instance

// Mock NodeCache
jest.mock('node-cache');

describe('Cache', () => {
  let mockNodeCache;
  let mockGet, mockSet, mockDel, mockFlushAll;

  beforeEach(() => {
    mockGet = jest.fn();
    mockSet = jest.fn();
    mockDel = jest.fn();
    mockFlushAll = jest.fn();

    NodeCache.mockImplementation(() => ({
      get: mockGet,
      set: mockSet,
      del: mockDel,
      flushAll: mockFlushAll
    }));
    // Mock the NodeCache constructor to return our mock instance
    NodeCache.mockImplementation(() => mockNodeCache);

    // Reset the NodeCache mock to ensure a fresh instance for each test
    jest.clearAllMocks();
    
    // Force the cache instance to use our mocked NodeCache
    cacheInstance.cache = mockNodeCache;
  });

  test('cache should be initialized with correct options', () => {
    expect(NodeCache).toHaveBeenCalledWith({ 
      stdTTL: 300, 
      checkperiod: 60 
    });
  });

  test('get should call NodeCache get method', () => {
    mockGet.mockReturnValue('cachedValue');
    const result = cacheInstance.get('testKey');
    expect(mockGet).toHaveBeenCalledWith('testKey');
    expect(result).toBe('cachedValue');
  });

  test('set should call NodeCache set method with correct parameters', () => {
    cacheInstance.set('testKey', 'testValue', 100);
    expect(mockSet).toHaveBeenCalledWith('testKey', 'testValue', 100);
  });

  test('del should call NodeCache del method', () => {
    cacheInstance.del('testKey');
    expect(mockDel).toHaveBeenCalledWith('testKey');
  });

  test('flush should call NodeCache flushAll method', () => {
    cacheInstance.flush();
    expect(mockFlushAll).toHaveBeenCalled();
  });

  test('get should return undefined for non-existent key', () => {
    mockGet.mockReturnValue(undefined);
    const result = cacheInstance.get('nonExistentKey');
    expect(result).toBeUndefined();
  });

});