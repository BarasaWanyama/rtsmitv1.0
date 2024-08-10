// Import required modules and configure environment variables
const { cacheMiddleware, clearCache, populateCache } = require('./cacheMiddleware');
const path = require('path');
const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');


require('dotenv').config({ path: __dirname + '/.env' });

// Initialize Express app and set port
const app = express();
const port = process.env.PORT || 5000;

// Middleware
// CORS configuration to allow credentials
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Ensure session configuration is secure
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  
  process.nextTick(() => {
    return done(null, profile);
  });
}));
passport.deserializeUser((user, done) => {
  done(null, user);
});
passport.serializeUser((user, done) => {
  done(null, user);
});

// Middleware to check authentication for protected routes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


// Google callback route to handle frontend redirection
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL);
  }
);
// Route to check user's authentication status
app.get('/auth/user', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout route
app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

// Call populateCache when the server starts
populateCache();

const itemsRouter = require('./routes/items');
const socialMediaPostsRouter = require('./routes/socialMediaPosts');

// Use isAuthenticated middleware for protected routes
app.use('/api/items', isAuthenticated, cacheMiddleware(300), itemsRouter);
app.use('/api/social-media-posts', isAuthenticated, cacheMiddleware(300), socialMediaPostsRouter);

// Social Media Data Aggregation Route
app.get('/api/social-media-data', isAuthenticated, cacheMiddleware(300), async (req, res) => {
  try {
    // Function to fetch data from a social media API
    const fetchSocialMediaData = async (url, params) => {
      const response = await axios.get(url, { params });
      return response.data;
    };

    // Fetch data from each platform
    const facebookData = await fetchSocialMediaData(process.env.FACEBOOK_API_URL, {
      access_token: process.env.FACEBOOK_API_KEY
    });

    const linkedInData = await fetchSocialMediaData(process.env.LINKEDIN_API_URL, {
      oauth2_access_token: process.env.LINKEDIN_API_KEY
    });

    const platformXData = await fetchSocialMediaData(process.env.PLATFORM_X_API_URL, {
      api_key: process.env.PLATFORM_X_API_KEY
    });

    // Aggregate and send the data
    res.json([
      { platform: 'Facebook', data: facebookData },
      { platform: 'LinkedIn', data: linkedInData },
      { platform: 'Platform X', data: platformXData }
    ]);
  } catch (error) {
    console.error('Detailed error fetching social media data:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    res.status(500).json({ error: 'Failed to fetch social media data', details: error.message });
  }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB database connection established successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('Error name:', err.name);
  console.error('Error code:', err.code);
  if (err.reason) console.error('Error reason:', err.reason);
});

// Serve React app for any unmatched routes, enabling client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});