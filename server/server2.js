// Import required modules and configure environment variables
import SocialMediaPost from './models/SocialMediaPost.js';
import { cacheMiddleware, clearCache } from'./cacheMiddleware.js';
import { populateCache } from './cachePopulator.js';
import path from 'path';
import axios from 'axios';
import express from'express';
import mongoose from'mongoose';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import itemsRouter from './routes/items.js';
import socialMediaPostsRouter from './routes/socialMediaPosts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Express app and set port
const app = express();
const port = process.env.PORT || 5000;

// Middleware to check authentication for protected routes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Use isAuthenticated middleware for protected routes
app.use('/api/items', isAuthenticated, cacheMiddleware(300), itemsRouter);
app.use('/api/social-media-posts', isAuthenticated, cacheMiddleware(300), socialMediaPostsRouter);

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

// Serialize and deserialize user for session storage
passport.deserializeUser((user, done) => done(null, user));
passport.serializeUser((user, done) => done(null, user));

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
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Error logging out' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.json({ message: 'Logged out successfully' });
    });
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

// Call populateCache when the server starts
populateCache();

// Social Media Data Aggregation Route
app.get('/api/social-media-posts', isAuthenticated, cacheMiddleware(300), async (req, res) => {
  try {
    // Check if the connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    const posts = await SocialMediaPost.find().lean().exec();
    res.json(posts);
  
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
  serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
})
.then(() => console.log('MongoDB database connection established successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('Error name:', err.name);
  console.error('Error code:', err.code);
  if (err.reason) console.error('Error reason:', err.reason);
  // Optionally, you might want to exit the process here if the DB connection is critical
  // process.exit(1);
});

// Handle errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
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
export default app;