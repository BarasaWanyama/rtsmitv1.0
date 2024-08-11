// cacheMiddleware.js
const cache = require('./cache');

const cacheMiddleware = (duration) => (req, res, next) => {
  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    res.send(cachedResponse);
  } else {
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    next();
  }
};

const clearCache = (key) => {
  cache.del(key);
};

module.exports = { cacheMiddleware, clearCache, cache };
