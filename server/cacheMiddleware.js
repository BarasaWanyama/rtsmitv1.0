// cacheMiddleware.js
const NodeCache = require('node-cache');
// Create a new cache instance
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes default TTL


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
const populateCache = () => {
  console.log('Populating cache with synthetic data...');
  const syntheticData = [
    {
      platform: 'Facebook',
      data: {
        posts: [
          { id: 'fb1', text: 'Sample Facebook post', likes: 100, shares: 20 },
          
          // Add more sample posts
        ]
      }
    },
    {
      platform: 'LinkedIn',
      data: {
        posts: [
          { id: 'li1', text: 'Sample LinkedIn post', likes: 50, shares: 10 },
          // Add more sample posts
        ]
      }
    },
    {
      platform: 'Platform X',
      data: {
        posts: [
          { id: 'px1', text: 'Sample Platform X post', likes: 200, shares: 30 },
          // Add more sample posts
        ]
      }
    }
  ];
  cache.set('social_media_data', syntheticData, 3600); // Cache for 1 hour
  console.log('Cache populated with synthetic data');
};
module.exports = { cacheMiddleware, cache, populateCache, clearCache };