const NodeCache = require('node-cache');
const Cache = require('../server/cache');

// Mock NodeCache
jest.mock('node-cache');

describe('Cache', () => {
  let cache;
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

    cache = new Cache();
  });

  test('constructor should create NodeCache with correct options', () => {
    expect(NodeCache).toHaveBeenCalledWith({ stdTTL: 300, checkperiod: 60 });
    
    const customCache = new Cache(600);
    expect(NodeCache).toHaveBeenCalledWith({ stdTTL: 600, checkperiod: 120 });
  });

  test('get should call NodeCache get method', () => {
    mockGet.mockReturnValue('cachedValue');
    const result = cache.get('testKey');
    expect(mockGet).toHaveBeenCalledWith('testKey');
    expect(result).toBe('cachedValue');
  });

  test('set should call NodeCache set method with correct parameters', () => {
    cache.set('testKey', 'testValue', 100);
    expect(mockSet).toHaveBeenCalledWith('testKey', 'testValue', 100);
  });

  test('del should call NodeCache del method', () => {
    cache.del('testKey');
    expect(mockDel).toHaveBeenCalledWith('testKey');
  });

  test('flush should call NodeCache flushAll method', () => {
    cache.flush();
    expect(mockFlushAll).toHaveBeenCalled();
  });

  test('get should return undefined for non-existent key', () => {
    mockGet.mockReturnValue(undefined);
    const result = cache.get('nonExistentKey');
    expect(result).toBeUndefined();
  });

});