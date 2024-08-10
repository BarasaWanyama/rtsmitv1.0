// cachePopulator.js
const { cache } = require('./cacheMiddleware');
const NodeCache = require('node-cache');

// Create a new cache instance (or import the one from cacheMiddleware.js)
const cache = new NodeCache({ stdTTL: 300 });

// Function to generate synthetic data for each platform
const generateSyntheticData = (platform) => {
  const posts = Array.from({ length: 10 }, (_, i) => ({
    id: `${platform.toLowerCase()}_post_${i + 1}`,
    text: `This is a sample post for ${platform} - ${i + 1}`,
    likes: Math.floor(Math.random() * 1000),
    shares: Math.floor(Math.random() * 100),
    date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    topic: ['Technology', 'Business', 'Entertainment'][Math.floor(Math.random() * 3)]
  }));

  return {
    platform,
    data: {
      posts,
      totalEngagement: posts.reduce((sum, post) => sum + post.likes + post.shares, 0),
      topPost: posts.reduce((top, post) => post.likes > top.likes ? post : top, posts[0])
    }
  };
};

// Function to populate the cache with synthetic data
const populateCache = () => {
  const platforms = ['Facebook', 'LinkedIn', 'Platform X'];
  const syntheticData = platforms.map(generateSyntheticData);

  cache.set('social_media_data', syntheticData, 3600); // Cache for 1 hour
  console.log('Cache populated with synthetic data');
};

module.exports = { cache, populateCache };