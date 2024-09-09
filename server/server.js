// Import required modules and configure environment variables
import SocialMediaPost from './models/SocialMediaPost.js';
import { cacheMiddleware, clearCache, cache } from'./cacheMiddleware.js';
import populateCache from './cachePopulator.js';
import path from 'node:path';
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