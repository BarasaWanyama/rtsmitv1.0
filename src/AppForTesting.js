import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { Dashboard } from './components/Dashboard.js';
import AlertsNotifications from './components/AlertsNotifications.js';
import Login from './components/Login.js';
import './App.css';

// ErrorFallback Component
const ErrorFallback = ({ error }) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  );
};

const API_BASE_URL = 'http://localhost:5000';

// Define and export API client object for making requests to a RESTful API
export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  },
  // Method to get all items
  getAllItems: () => apiClient.request('/items.js'),
  // Method to get a single item by ID
  getItem: (id) => apiClient.request(`/items.js/${id}`),
  // Method to create a new item
  createItem: (name) => apiClient.request('/items.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }),
  // Method to update an existing item
  updateItem: (id, name) => apiClient.request(`/items.js/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }),
  // Method to delete an item
  deleteItem: (id) => apiClient.request(`/items.js/${id}`, { method: 'DELETE' }),
  // Implement caching for social media data
  getSocialMediaData: async () => {
    const cachedData = localStorage.getItem('socialMediaData');
    const cachedTime = localStorage.getItem('socialMediaDataTime');
    const currentTime = Date.now();
    if (cachedData && cachedTime && currentTime - parseInt(cachedTime) < 60000) {
      console.log('Using cached social media data');
      return JSON.parse(cachedData);
    }
    console.log('Fetching fresh social media data from API');
    try {
      const data = await apiClient.request('/api/social-media-posts');
      localStorage.setItem('socialMediaData', JSON.stringify(data));
      localStorage.setItem('socialMediaDataTime', currentTime.toString());
      return data;
    } catch (error) {
      console.error('Error fetching social media data:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },
};

// Extracted functions

// Load sentiment analysis model and handle potential errors
export const loadModel = async (setModel, setError) => {
  try {
    const loadedModel = await use.load();
    setModel(loadedModel);
  } catch (err) {
    console.error('Error loading model:', err);
    setError('Error loading sentiment analysis model. Please try again.');
  }
};

// Analyze sentiment of given text using a pre-loaded model
export const analyzeSentiment = async (model, text) => {
  try {
    if (!model) {
      console.error('Sentiment analysis model is not loaded');
      return null;
    }
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.error('Invalid input text for sentiment analysis');
      return null;
    }

    const embeddings = await model.embed(text);
    
    const sentiment = tf.tidy(() => {
      const sum = embeddings.sum(1);
      const mean = sum.div(tf.scalar(embeddings.shape[1]));
      return mean.dataSync()[0];
    });
    
    embeddings.dispose();
    
    let label;
    if (sentiment > 0.5) label = 'Positive';
    else if (sentiment < -0.5) label = 'Negative';
    else label = 'Neutral';

    console.log('Sentiment result:', { score: sentiment, label });
    return { score: sentiment, label };
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    return null;
  }
};

// Fetch social media data, analyze sentiment, and update application state
export const fetchSocialMediaData = async (apiClient, model, analyzeSentiment, setSocialMediaData, setSentimentData, setError, setLoading) => {
  console.log('Fetching social media data...');
  setLoading(true);
  try {
    const data = await apiClient.getSocialMediaData();
    console.log('Social media data received:', data);

    let postsArray = Array.isArray(data) ? data : data.posts || [];
    if (!Array.isArray(postsArray)) {
      console.error('Received data is not in the expected format:', data);
      postsArray = [];
    }
    setSocialMediaData(postsArray);
    console.log('Social media data set:', postsArray);
    if (model && postsArray.length > 0) {
      const sentiments = await Promise.all(
        postsArray.map(async (post) => ({
          ...post,
          sentiment: await analyzeSentiment(model, post.text)
        }))
      );
      setSentimentData(sentiments);
    }
    setError(null);
  } catch (error) {
    console.error('Error fetching data or analyzing sentiment:', error);
    setError('Error fetching data or analyzing sentiment. Please try again.');
    setSocialMediaData([]);
  } finally {
    setLoading(false);
  }
};

// Filter and sort social media data based on user-defined criteria
export const getFilteredAndSortedData = (socialMediaData, filters, sortBy) => {
  if (!socialMediaData || !Array.isArray(socialMediaData)) return [];
  const sevenDaysAgo = filters.dateRange === '7days' 
    ? Date.now() - 7 * 24 * 60 * 60 * 1000 
    : null;
  return [...socialMediaData]
    .filter(post => 
      (filters.topic === 'All' || post.topic === filters.topic) &&
      (!sevenDaysAgo || new Date(post.date).getTime() >= sevenDaysAgo)
    )
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'likes') return b.likes - a.likes;
      return 0;
    });
};

// Update filters state with new filter values while preserving existing filters
export const handleFilterChange = (setFilters, newFilters) => {
  setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
};

// Update sort criteria state
export const handleSortChange = (setSortBy, newSortBy) => {
  setSortBy(newSortBy);
};

// Perform sentiment analysis on custom text input and update UI
export const handleCustomTextAnalysis = async (analyzeSentiment, model, setCustomSentiment, addAlert) => {
  const text = document.getElementById('customText').value;
  if (text) {
    try {
      const sentiment = await analyzeSentiment(model, text);
      if (sentiment && sentiment.label) {
        setCustomSentiment(sentiment);
        addAlert(`Sentiment analysis completed: ${sentiment.label}`, 'success');
      } else {
        throw new Error('Invalid sentiment result');
      }
    } catch (error) {
      console.error('Error during sentiment analysis:', error);
      addAlert('Error during sentiment analysis. Please try again.', 'error');
      setCustomSentiment(null);
    }
  } else {
    addAlert('Please enter some text to analyze.', 'warning');
  }
};

// Add a new alert to the alerts state
export const addAlert = (setAlerts, message, type = 'info') => {
  const newAlert = {
    id: Date.now(),
    message,
    type,
  };
  setAlerts(prevAlerts => [...prevAlerts, newAlert]);
};

// Remove a specific alert from the alerts state by its ID
export const removeAlert = (setAlerts, id) => {
  setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
};

// Redirect user to Google OAuth login page
export const handleGoogleLogin = (API_BASE_URL) => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};

// Check user authentication status and update user state
export const checkAuth = async (apiClient, setUser) => {
  try {
    const userData = await apiClient.request('/auth/user');
    setUser(userData);
  } 
  catch (error) {
    console.error('Error checking authentication:', error);
  }
};

// Handle user logout process, update state, and redirect on success
export const handleLogout = async (apiClient, setUser, setError) => {
  try {
    const response = await apiClient.request('/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    });
    console.log('Logout response:', response);
    if (response.message === 'Logged out successfully') {
      setUser(null);
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else {
      console.error('Logout failed:', response);
      setError('Logout failed. Please try again.');
    }
  } catch (error) {
    console.error('Error logging out:', error);
    setError('Error logging out. Please try again.');
  }
};

function AppForTesting() {
  // State declarations
  const [socialMediaData, setSocialMediaData] = useState({});
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);
  const [customSentiment, setCustomSentiment] = useState(null);
  const [filters, setFilters] = useState({ topic: 'All', dateRange: '7days' });
  const [sortBy, setSortBy] = useState('date');
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Use extracted functions within the App component

  // Load the sentiment analysis model on component mount
  useEffect(() => {
    loadModel(setModel, setError);
  }, []);

  // Define a memoized function to fetch social media data and analyze sentiment
  const fetchData = useCallback(() => 
    fetchSocialMediaData(apiClient, model, analyzeSentiment, setSocialMediaData, setSentimentData, setError, setLoading),
   [model]);

  // Fetch data initially and set up an interval to fetch data every 30 seconds
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const [isAuthChecked, setIsAuthChecked] = useState(false);
  // Check user authentication on component mount
  useEffect(() => {
    const checkAuthentication = async () => {
      await checkAuth(apiClient, setUser);
      setIsAuthChecked(true);
    };
    checkAuthentication();
  }, []);

  //Filter and sort socialmedia data
  const filteredAndSortedData = useMemo(() => 
    getFilteredAndSortedData(socialMediaData, filters, sortBy),
    [socialMediaData, filters, sortBy]
  );

  // Update filters by merging new filter values with existing ones
  const handleFilterChangeCallback = useCallback((newFilters) => {
    handleFilterChange(setFilters, newFilters);
  }, []);

  // Set the new sorting criteria for the data
  const handleSortChangeCallback = useCallback((newSortBy) => {
    handleSortChange(setSortBy, newSortBy);
  }, []);

  // add a new alert
  const addAlertCallback = useCallback((message, type) => {
    addAlert(setAlerts, message, type);
  }, []);

  // remove an alert
  const removeAlertCallback = useCallback((id) => {
    removeAlert(setAlerts, id);
  }, []);

  // Analyze sentiment of user-provided text and update custom sentiment state
  const handleCustomTextAnalysisCallback = useCallback(() => 
    handleCustomTextAnalysis(analyzeSentiment, model, setCustomSentiment, addAlertCallback),
    [model, addAlertCallback]
  );
  
  // handle Google login
  const handleGoogleLoginCallback = useCallback(() => {
    handleGoogleLogin(API_BASE_URL);
  }, []);

  // handle logout
  const handleLogoutCallback = useCallback(async () => {
    try {
      await handleLogout(apiClient, setUser, setError);
      // Additional client-side cleanup if needed
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Logout failed. Please try again.');
    }
  }, []);
  
  // Log when the App component mounts
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  // Log every time the App component renders
  console.log('Rendering App component');

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="App">
        <div data-testid="auth-state" style={{display: 'none'}}>{isAuthChecked ? 'checked' : 'unchecked'}</div>
          <p>App is rendering</p>
          <h1>Real-Time Social Media Impact Tracker </h1>
          {loading && <p>Loading...</p>}
          {error && <p className="error-message">{error}</p>}
          {user ? (
                <>
                  <p>Welcome, {user.displayName}!</p>
                  <button onClick={handleLogoutCallback}>Logout</button>
                  <AlertsNotifications alerts={alerts} removeAlert={removeAlertCallback} />
                  <Dashboard
                    socialMediaData={filteredAndSortedData}
                    sentimentData={sentimentData}
                    filters={filters}
                    sortBy={sortBy}
                    onFilterChange={handleFilterChangeCallback}
                    onSortChange={handleSortChangeCallback}
                  />
                  <button onClick={fetchData}>Refresh Data</button>
                  <div>
                    <h2>Analyze Custom Text</h2>
                    <textarea
                      id="customText"
                      rows="4"
                      cols="50"
                      placeholder="Enter text to analyze sentiment"
                      aria-label="Custom text for sentiment analysis"
                    ></textarea>
                    <button onClick={handleCustomTextAnalysisCallback}>
                      Analyze Sentiment
                    </button>
                    {customSentiment && (
                      <div>
                        <h3>Sentiment Analysis Result:</h3>
                        <p>Score: {customSentiment.score.toFixed(2)}</p>
                        <p>Label: {customSentiment.label}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Login onGoogleLogin={handleGoogleLoginCallback} />
              )}
        </div>
    </ErrorBoundary>
  );
}

export default AppForTesting;