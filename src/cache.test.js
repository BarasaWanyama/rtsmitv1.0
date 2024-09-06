const NodeCache = require('node-cache');
const Cache = require('../server/cache');

// Mock Node cache
let mockNodeCache;

jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => {
    mockNodeCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn()
    };
    return mockNodeCache;
  });
});

describe('Cache', () => {
  let cache;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new Cache();
  });

  test('constructor should create NodeCache with correct options', () => {
    const defaultCache = new Cache();
    expect(NodeCache).toHaveBeenCalledWith({ stdTTL: 300, checkperiod: 60 });
    
    const customCache = new Cache(600);
    expect(NodeCache).toHaveBeenCalledWith({ stdTTL: 600, checkperiod: 120 });
  });

  test('get should call NodeCache get method and return the result', () => {
    mockNodeCache.get.mockReturnValue('cachedValue');
    const result = cache.get('testKey');
    expect(mockNodeCache.get).toHaveBeenCalledWith('testKey');
    expect(result).toBe('cachedValue');
  });

  test('set should call NodeCache set method with correct parameters', () => {
    cache.set('testKey', 'testValue', 100);
    expect(mockNodeCache.set).toHaveBeenCalledWith('testKey', 'testValue', 100);
  });
  

  test('del should call NodeCache del method', () => {
    cache.del('testKey');
    expect(mockNodeCache.del).toHaveBeenCalledWith('testKey');
  });

  test('flush should call NodeCache flushAll method', () => {
    cache.flush();
    expect(mockNodeCache.flushAll).toHaveBeenCalled();
  });

  test('get should return undefined for non-existent key', () => {
    mockNodeCache.get.mockReturnValue(undefined);
    const result = cache.get('nonExistentKey');
    expect(result).toBeUndefined();
  });
  
  test('set should throw an error if key is not a string', () => {
    expect(() => cache.set(123, 'value')).toThrow();
  });

  test('flush should not throw when called', () => {
    const cache = new Cache();
    expect(() => cache.flush()).not.toThrow();
  });
});