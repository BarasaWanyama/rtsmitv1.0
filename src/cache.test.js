const NodeCache = require('node-cache');
const Cache = require('../server/cache');

// Mock NodeCache
jest.mock('node-cache');

describe('Cache', () => {
  let mockNodeCache;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new mock instance for each test
    mockNodeCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn()
    };

    // Make NodeCache constructor return our mock
    NodeCache.mockImplementation(() => mockNodeCache);
  });

  test('constructor should create NodeCache with correct options', () => {
    new Cache(600);
    expect(NodeCache).toHaveBeenCalledWith({ stdTTL: 600, checkperiod: 120 });
  });

  test('constructor should use default TTL if not provided', () => {
    new Cache();
    expect(NodeCache).toHaveBeenCalledWith({ stdTTL: 300, checkperiod: 60 });
  });

  test('get should call NodeCache get method', () => {
    const cache = new Cache();
    cache.get('testKey');
    expect(mockNodeCache.get).toHaveBeenCalledWith('testKey');
  });

  test('set should call NodeCache set method with correct parameters', () => {
    const cache = new Cache();
    cache.set('testKey', 'testValue', 100);
    expect(mockNodeCache.set).toHaveBeenCalledWith('testKey', 'testValue', 100);
  });

  test('del should call NodeCache del method', () => {
    const cache = new Cache();
    cache.del('testKey');
    expect(mockNodeCache.del).toHaveBeenCalledWith('testKey');
  });

  test('flush should call NodeCache flushAll method', () => {
    const cache = new Cache();
    cache.flush();
    expect(mockNodeCache.flushAll).toHaveBeenCalled();
  });

  test('get should return the value from NodeCache', () => {
    const cache = new Cache();
    mockNodeCache.get.mockReturnValue('cachedValue');
    const result = cache.get('testKey');
    expect(result).toBe('cachedValue');
  });

  test('set should not throw when called with correct parameters', () => {
    const cache = new Cache();
    expect(() => cache.set('testKey', 'testValue', 100)).not.toThrow();
  });

  test('del should not throw when called with a key', () => {
    const cache = new Cache();
    expect(() => cache.del('testKey')).not.toThrow();
  });

  test('flush should not throw when called', () => {
    const cache = new Cache();
    expect(() => cache.flush()).not.toThrow();
  });
});