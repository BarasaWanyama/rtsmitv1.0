const NodeCache = require('node-cache');
const Cache = require('../server/cache');

// Mock NodeCache
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn()
    };
  });
});

describe('Cache', () => {
  let cache;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new Cache();
  });

  test('constructor should create NodeCache with correct options', () => {
    expect(NodeCache).toHaveBeenCalledWith({ stdTTL: 300, checkperiod: 60 });
    
    const customCache = new Cache(600);
    expect(NodeCache).toHaveBeenCalledWith({ stdTTL: 600, checkperiod: 120 });
  });

  test('get should call NodeCache get method', () => {
    cache.cache.get.mockReturnValue('cachedValue');
    const result = cache.get('testKey');
    expect(cache.cache.get).toHaveBeenCalledWith('testKey');
    expect(result).toBe('cachedValue');
  });

  test('set should call NodeCache set method with correct parameters', () => {
    cache.set('testKey', 'testValue', 100);
    expect(cache.cache.set).toHaveBeenCalledWith('testKey', 'testValue', 100);
  });

  test('del should call NodeCache del method', () => {
    cache.del('testKey');
    expect(cache.cache.del).toHaveBeenCalledWith('testKey');
  });

  test('flush should call NodeCache flushAll method', () => {
    cache.flush();
    expect(cache.cache.flushAll).toHaveBeenCalled();
  });

  test('get should return undefined for non-existent key', () => {
    cache.cache.get.mockReturnValue(undefined);
    const result = cache.get('nonExistentKey');
    expect(result).toBeUndefined();
  });
  
});