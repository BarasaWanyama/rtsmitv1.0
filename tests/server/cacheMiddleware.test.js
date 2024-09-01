const { cacheMiddleware, clearCache, cache } = require('../../server/cacheMiddleware');

// Mock the cache module
jest.mock('../../server/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

describe('cacheMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { originalUrl: '/test-url' };
    res = {
      send: jest.fn(),
      sendResponse: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should return cached response if available', () => {
    const cachedResponse = { data: 'cached data' };
    cache.get.mockReturnValue(cachedResponse);

    cacheMiddleware(300)(req, res, next);

    expect(cache.get).toHaveBeenCalledWith('/test-url');
    expect(res.send).toHaveBeenCalledWith(cachedResponse);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next() if cached response is not available', () => {
    cache.get.mockReturnValue(null);

    cacheMiddleware(300)(req, res, next);

    expect(cache.get).toHaveBeenCalledWith('/test-url');
    expect(next).toHaveBeenCalled();
  });

  test('should override res.send and cache the response', () => {
    cache.get.mockReturnValue(null);
    const responseBody = { data: 'response data' };

    cacheMiddleware(300)(req, res, next);
    res.send(responseBody);

    expect(cache.set).toHaveBeenCalledWith('/test-url', responseBody, 300);
    expect(res.sendResponse).toHaveBeenCalledWith(responseBody);
  });

  test('should use req.url if originalUrl is not available', () => {
    req = { url: '/alternate-url' };
    cache.get.mockReturnValue(null);

    cacheMiddleware(300)(req, res, next);

    expect(cache.get).toHaveBeenCalledWith('/alternate-url');
  });
});

describe('clearCache', () => {
  test('should call cache.del with the provided key', () => {
    clearCache('test-key');

    expect(cache.del).toHaveBeenCalledWith('test-key');
  });
});