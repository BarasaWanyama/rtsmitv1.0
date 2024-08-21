// cachePopulator.js
const cache = require('./cache');
const axios = require('axios');

const fetchPublicData = async (platform) => {
  let url;
  switch (platform) {
    case 'LinkedIn':
      url = 'https://api.linkedin.com/v2/posts?q=author&author=urn:li:organization:1337';
      break;
    case 'Facebook':
      url = 'https://graph.facebook.com/v12.0/me/feed?fields=id,message,created_time,likes.summary(true),shares';
      break;
    case 'Platform X':
      url = 'https://api.twitter.com/2/tweets/search/recent?query=from:twitterdev';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env[`${platform.toUpperCase()}_API_TOKEN`]}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${platform}:`, error.message);
    return null;
  }
};

const transformData = (platform, rawData) => {
  if (!rawData) return null;

  let posts;
  switch (platform) {
    case 'LinkedIn':
      posts = rawData.elements.map(post => ({
        id: post.id,
        text: post.commentary,
        likes: post.socialMetrics.numLikes,
        shares: post.socialMetrics.numShares,
        date: post.created.time,
        topic: post.topics[0]?.localizedName || 'General'
      }));
      break;
    case 'Facebook':
      posts = rawData.data.map(post => ({
        id: post.id,
        text: post.message,
        likes: post.likes.summary.total_count,
        shares: post.shares ? post.shares.count : 0,
        date: post.created_time,
        topic: 'General' // Facebook doesn't provide a topic, so we use a default
      }));
      break;
    case 'Platform X':
      posts = rawData.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        likes: tweet.public_metrics.like_count,
        shares: tweet.public_metrics.retweet_count,
        date: tweet.created_at,
        topic: tweet.entities?.hashtags[0]?.tag || 'General'
      }));
      break;
  }

  return {
    platform,
    data: {
      posts,
      totalEngagement: posts.reduce((sum, post) => sum + post.likes + post.shares, 0),
      topPost: posts.reduce((top, post) => post.likes > top.likes ? post : top, posts[0])
    }
  };
};

const populateCache = async () => {
  console.log('Populating cache with public API data...');
  const platforms = ['Facebook', 'LinkedIn', 'Platform X'];
  const publicData = await Promise.all(platforms.map(async platform => {
    const rawData = await fetchPublicData(platform);
    return transformData(platform, rawData);
  }));

  const validData = publicData.filter(data => data !== null);

  if (validData.length > 0) {
    cache.set('social_media_data', validData, 3600); // Cache for 1 hour
    console.log('Cache populated with public API data');
  } else {
    console.log('Failed to fetch public API data. Using synthetic data as fallback.');
    const syntheticData = platforms.map(generateSyntheticData);
    cache.set('social_media_data', syntheticData, 3600);
    console.log('Cache populated with synthetic data');
  }
};

// generateSyntheticData function as a fallback
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

module.exports = { populateCache };