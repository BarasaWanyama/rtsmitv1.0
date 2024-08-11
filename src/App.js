// Import React hooks, TensorFlow.js libraries, custom components, and styles
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import Dashboard from './components/Dashboard';
import AlertsNotifications from './components/AlertsNotifications';
import Login from './components/Login';
import './App.css';
const API_BASE_URL = 'http://localhost:5000';

function ErrorFallback({error}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{color: 'red'}}>{error.message}</pre>
    </div>
  )
}

// API client object for making requests to a RESTful API
const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {options, credentials: 'include'});
    if (!response.ok) {
      // Throw an error if the response is not successful
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  },
  // Method to get all items
  getAllItems: () => apiClient.request('/items'),
  // Method to get a single item by ID
  getItem: (id) => apiClient.request(`/items/${id}`),
  // Method to create a new item
  createItem: (name) => apiClient.request('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }),
  // Method to update an existing item
  updateItem: (id, name) => apiClient.request(`/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }),
  // Method to delete an item
  deleteItem: (id) => apiClient.request(`/items/${id}`, { method: 'DELETE' }),
};

// App component: Manages state for various functions 
function App() {
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

  // Load the Universal Sentence Encoder model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await use.load();
        setModel(loadedModel);
      } catch (err) {
        console.error('Error loading model:', err);
        setError('Error loading sentiment analysis model. Please try again.');
      }
    };
    loadModel();
  }, []);

  // Function to perform sentiment analysis
  const analyzeSentiment = useCallback(async (text) => {
    if (!model) return null;

    const embeddings = await model.embed(text);
    const sentiment = tf.tidy(() => {
      const sum = embeddings.sum(1);
      const mean = sum.div(tf.scalar(embeddings.shape[1]));
      return mean.dataSync()[0];
    });

    embeddings.dispose();

    // Map sentiment score to labels
    let label;
    if (sentiment > 0.5) label = 'Positive';
    else if (sentiment < -0.5) label = 'Negative';
    else label = 'Neutral';

    return { score: sentiment, label };
  }, [model]);

  // Fetch social media data and perform sentiment analysis if a model is available
  const fetchSocialMediaData = useCallback(async () => {
    console.log('Fetching social media data...');
    setLoading(true);
    try {
      const data = await apiClient.getSocialMediaData();
      console.log('Social media data received:', data);
      setSocialMediaData(data);
      
      if (model) {
        const sentiments = await Promise.all(
          data.map(async (post) => ({
            ...post,
            sentiment: await analyzeSentiment(post.text)
          }))
        );
        setSentimentData(sentiments);
      }
  
      setError(null);
    } catch (error) {
      console.error('Error fetching data or analyzing sentiment:', error);
      setError('Error fetching data or analyzing sentiment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [model, analyzeSentiment]);
  
  // Fetche social media data initially and set up periodic fetching every 30 seconds
  useEffect(() => {
    fetchSocialMediaData();
    const intervalId = setInterval(fetchSocialMediaData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchSocialMediaData]);

  // Example usage of API functions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const items = await apiClient.getAllItems();
        console.log('All items:', items);

        const newItem = await apiClient.createItem('New Item');
        console.log('Created item:', newItem);

        const updatedItem = await apiClient.updateItem(newItem.id, 'Updated Item');
        console.log('Updated item:', updatedItem);

        const deletedItem = await apiClient.deleteItem(newItem.id);
        console.log('Deleted item:', deletedItem);
      } catch (error) {
        console.error('API error:', error);
      }
    };

    fetchData();
  }, []);

  //Filter and sort social media posts based on user-defined criteria
  const filteredAndSortedData = useMemo(() => {
    if (!socialMediaData || !Array.isArray(socialMediaData)) return [];
  
    let result = socialMediaData;
    
    // Apply filters
    if (filters.topic !== 'All') {
      result = result.filter(post => post.topic === filters.topic);
    }
    
    if (filters.dateRange === '7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(post => new Date(post.date) >= sevenDaysAgo);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'likes') return b.likes - a.likes;
      return 0;
    });
    
    return result;
  }, [socialMediaData, filters, sortBy]);

  // Update filters by merging new filter values with existing ones
  const handleFilterChange = (newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  // Set the new sorting criteria for the data
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  // Analyze sentiment of user-provided text and update custom sentiment state
  const handleCustomTextAnalysis = async () => {
    const text = document.getElementById('customText').value;
    if (text) {
      const sentiment = await analyzeSentiment(text);
      setCustomSentiment(sentiment);
      addAlert(`Sentiment analysis completed: ${sentiment.label}`, 'success');
    }
  };
  // Function to add a new alert
  const addAlert = (message, type = 'info') => {
    const newAlert = {
      id: Date.now(),
      message,
      type,
    };
    setAlerts(prevAlerts => [...prevAlerts, newAlert]);
  };
  // Function to remove an alert
  const removeAlert = (id) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
  };

  // Function to handle Google login
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  // Function to check user authentication status
  useEffect(() => {
    const checkAuth = async () => {
    try {
      const userData = await apiClient.request('/auth/user');
      setUser(userData);
      } 
      catch (error) {
      console.error('Error checking authentication:', error);
      }
    };
    checkAuth();
  }, []);

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await apiClient.request('/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  console.log('Rendering App component');

  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Router>
          <div className="App">
            <p>App is rendering</p>
            <h1>Real-Time Social Media Impact Tracker </h1>
            {loading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            <Routes>
              <Route path="/login" element={
                user ? <Navigate to="/" replace /> : <Login onGoogleLogin={handleGoogleLogin} />
              } />
              <Route path="/" element={
                user ? (
                  <>
                    <p>Welcome, {user.displayName}!</p>
                    <button onClick={handleLogout}>Logout</button>
                    <AlertsNotifications alerts={alerts} removeAlert={removeAlert} />
                    <Dashboard
                      socialMediaData={filteredAndSortedData}
                      sentimentData={sentimentData}
                      filters={filters}
                      sortBy={sortBy}
                      onFilterChange={handleFilterChange}
                      onSortChange={handleSortChange}
                    />
                    <button onClick={fetchSocialMediaData}>Refresh Data</button>
                    <div>
                      <h2>Analyze Custom Text</h2>
                      <textarea
                        id="customText"
                        rows="4"
                        cols="50"
                        placeholder="Enter text to analyze sentiment"
                        aria-label="Custom text for sentiment analysis"
                      ></textarea>
                      <button onClick={handleCustomTextAnalysis}>
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
                  <Navigate to="/login" replace />
                )
              } />
            </Routes>
          </div>
        </Router>
      </ErrorBoundary>
    </>
  );
}

export default App;
