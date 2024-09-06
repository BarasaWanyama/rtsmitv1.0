// Mock API client
const apiClientMock = {
  request: jest.fn(),
  getSocialMediaData: jest.fn(),
  getAllItems: jest.fn(),
  getItem: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn()
};

jest.mock('./AppForTesting', () => ({
  ...jest.requireActual('./AppForTesting'),
  apiClient: apiClientMock
}));

import React from 'react';
import { render, screen, waitFor, act, fireEvent, render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AppForTesting, { loadModel, analyzeSentiment, fetchSocialMediaData, getFilteredAndSortedData, handleFilterChange, handleSortChange, handleCustomTextAnalysis, addAlert, removeAlert, handleGoogleLogin, checkAuth, handleLogout, apiClient } from './AppForTesting';
import * as tf from '@tensorflow/tfjs';

const use = require('@tensorflow-models/universal-sentence-encoder');

function customRender(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);
  
  return rtlRender(ui, { wrapper: BrowserRouter });
}


// Mock environment variables
beforeAll(() => {
  process.env.REACT_APP_API_BASE_URL = 'http://localhost:3000';
});

afterAll(() => {
  delete process.env.REACT_APP_API_BASE_URL;
});


// Mock the '@tensorflow-models/universal-sentence-encoder' module
jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn().mockResolvedValue({
    embed: jest.fn().mockResolvedValue({
      arraySync: jest.fn().mockReturnValue([[1, 2, 3]])
    })
  })
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });


beforeEach(() => {
  fetch.mockClear();
  localStorageMock.clear();
  jest.clearAllMocks();
  apiClient.request.mockResolvedValue({ /* mock data */ });
  apiClient.getSocialMediaData.mockResolvedValue([/* mock social media data */]);
});


// Mock the TensorFlow.js and USE model
jest.mock('@tensorflow/tfjs', () => ({
  tidy: jest.fn((callback) => callback()),
  scalar: jest.fn(),
}));
jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn().mockResolvedValue({
    embed: jest.fn().mockResolvedValue({
      sum: jest.fn().mockReturnValue({
        div: jest.fn().mockReturnValue({
          dataSync: jest.fn().mockReturnValue([0.5]),
        }),
      }),
      dispose: jest.fn(),
    }),
  }),
}));

  describe('App Component', () => {
    test('renders without crashing', async () => {
      apiClient.request.mockResolvedValueOnce(null); // Mock no user for initial load
  
      await act(async () => {
        customRender(<AppForTesting />);
      });
      
      expect(screen.getByText(/Real-Time Social Media Impact Tracker/i)).toBeInTheDocument();
    });

    test('displays login page when user is not authenticated', async () => {
      apiClient.request.mockResolvedValueOnce(null); // Mock no user
  
      await act(async () => {
        customRender(<AppForTesting />);
      });
  
      await waitFor(() => {
        expect(screen.getByText(/Login with Google/i)).toBeInTheDocument();
      });
    });
    test('displays dashboard when user is authenticated', async () => {
      apiClientMock.request.mockResolvedValueOnce({ displayName: 'Test User' });
      apiClientMock.getSocialMediaData.mockResolvedValueOnce([]);
    
      await act(async () => {
        customRender(<AppForTesting />);
      });
    
      await waitFor(() => {
        expect(screen.getByText(/Welcome, Test User!/i)).toBeInTheDocument();
      });
    }); 
    
    test('handles logout correctly', async () => {
      apiClient.request
        .mockResolvedValueOnce({ displayName: 'Test User' })
        .mockResolvedValueOnce({ message: 'Logged out successfully' });
      apiClient.getSocialMediaData.mockResolvedValueOnce([]);
    
      await act(async () => {
        customRender(<AppForTesting />);
      });
    
      await waitFor(() => {
        expect(screen.getByText(/Welcome, Test User!/i)).toBeInTheDocument();
      });
    
      await act(async () => {
        fireEvent.click(screen.getByText(/Logout/i));
      });
    
      await waitFor(() => {
        expect(screen.getByText(/Login with Google/i)).toBeInTheDocument();
      });
    });

  });

  describe('loadModel function', () => {
    let setModel;
    let setError;
  
    beforeEach(() => {
      setModel = jest.fn();
      setError = jest.fn();
      jest.clearAllMocks();
    });
  
    test('should load model successfully', async () => {
      const mockModel = { name: 'mockModel' };
      use.load.mockResolvedValue(mockModel);
  
      await loadModel(setModel, setError);
  
      expect(use.load).toHaveBeenCalled();
      expect(setModel).toHaveBeenCalledWith(mockModel);
      expect(setError).not.toHaveBeenCalled();
    });
  
    test('should handle error when loading model fails', async () => {
      const mockError = new Error('Failed to load model');
      use.load.mockRejectedValue(mockError);
  
      await loadModel(setModel, setError);
  
      expect(use.load).toHaveBeenCalled();
      expect(setModel).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Error loading sentiment analysis model. Please try again.');
    });
  });

jest.mock('@tensorflow/tfjs');

describe('analyzeSentiment function', () => {
  let mockModel;
  let mockEmbeddings;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmbeddings = {
      sum: jest.fn().mockReturnThis(),
      div: jest.fn().mockReturnThis(),
      dataSync: jest.fn().mockReturnValue([0.7]), // Default to positive sentiment
      dispose: jest.fn(),
      shape: [1, 512], // Typical shape for USE embeddings
    };
    mockModel = {
      embed: jest.fn().mockResolvedValue(mockEmbeddings),
    };
    tf.tidy.mockImplementation((callback) => callback());
    tf.scalar.mockReturnValue({ dataSync: () => [512] });
  });

  test('should return null when model is not loaded', async () => {
    const result = await analyzeSentiment(null, 'test text');
    expect(result).toBeNull();
  });

  test('should return null for invalid input text', async () => {
    const invalidInputs = [null, undefined, '', '   ', 123];
    for (const input of invalidInputs) {
      const result = await analyzeSentiment(mockModel, input);
      expect(result).toBeNull();
    }
  });

  test('should correctly analyze positive sentiment', async () => {
    mockEmbeddings.dataSync.mockReturnValue([0.7]);
    const result = await analyzeSentiment(mockModel, 'This is great!');
    expect(result).toEqual({ score: 0.7, label: 'Positive' });
    expect(mockModel.embed).toHaveBeenCalledWith('This is great!');
    expect(mockEmbeddings.dispose).toHaveBeenCalled();
  });

  test('should correctly analyze negative sentiment', async () => {
    mockEmbeddings.dataSync.mockReturnValue([-0.7]);
    const result = await analyzeSentiment(mockModel, 'This is terrible!');
    expect(result).toEqual({ score: -0.7, label: 'Negative' });
  });

  test('should correctly analyze neutral sentiment', async () => {
    mockEmbeddings.dataSync.mockReturnValue([0]);
    const result = await analyzeSentiment(mockModel, 'This is okay.');
    expect(result).toEqual({ score: 0, label: 'Neutral' });
  });

  test('should handle errors and return null', async () => {
    mockModel.embed.mockRejectedValue(new Error('Embedding failed'));
    const result = await analyzeSentiment(mockModel, 'Test text');
    expect(result).toBeNull();
  });

  test('should use tf.tidy for memory efficiency', async () => {
    await analyzeSentiment(mockModel, 'Test text');
    expect(tf.tidy).toHaveBeenCalled();
  });
});

describe('fetchSocialMediaData function', () => {
  let mockApiClient;
  let mockModel;
  let mockAnalyzeSentiment;
  let mockSetSocialMediaData;
  let mockSetSentimentData;
  let mockSetError;
  let mockSetLoading;

  beforeEach(() => {
    mockApiClient = {
      getSocialMediaData: jest.fn(),
    };
    mockModel = {};
    mockAnalyzeSentiment = jest.fn();
    mockSetSocialMediaData = jest.fn();
    mockSetSentimentData = jest.fn();
    mockSetError = jest.fn();
    mockSetLoading = jest.fn();
  });

  test('should fetch and process social media data successfully', async () => {
    const mockData = [
      { id: 1, text: 'Great post!' },
      { id: 2, text: 'Terrible experience.' },
    ];
    mockApiClient.getSocialMediaData.mockResolvedValue(mockData);
    mockAnalyzeSentiment.mockImplementation((model, text) => 
      Promise.resolve({ score: text.includes('Great') ? 0.8 : -0.8, label: text.includes('Great') ? 'Positive' : 'Negative' })
    );

    await fetchSocialMediaData(
      mockApiClient,
      mockModel,
      mockAnalyzeSentiment,
      mockSetSocialMediaData,
      mockSetSentimentData,
      mockSetError,
      mockSetLoading
    );

    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockApiClient.getSocialMediaData).toHaveBeenCalled();
    expect(mockSetSocialMediaData).toHaveBeenCalledWith(mockData);
    expect(mockAnalyzeSentiment).toHaveBeenCalledTimes(2);
    expect(mockSetSentimentData).toHaveBeenCalledWith([
      { id: 1, text: 'Great post!', sentiment: { score: 0.8, label: 'Positive' } },
      { id: 2, text: 'Terrible experience.', sentiment: { score: -0.8, label: 'Negative' } },
    ]);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  test('should handle data in unexpected format', async () => {
    const mockData = { unexpectedFormat: true };
    mockApiClient.getSocialMediaData.mockResolvedValue(mockData);

    await fetchSocialMediaData(
      mockApiClient,
      mockModel,
      mockAnalyzeSentiment,
      mockSetSocialMediaData,
      mockSetSentimentData,
      mockSetError,
      mockSetLoading
    );

    expect(mockSetSocialMediaData).toHaveBeenCalledWith([]);
    expect(mockSetSentimentData).not.toHaveBeenCalled();
  });

  test('should handle API error', async () => {
    const mockError = new Error('API Error');
    mockApiClient.getSocialMediaData.mockRejectedValue(mockError);

    await fetchSocialMediaData(
      mockApiClient,
      mockModel,
      mockAnalyzeSentiment,
      mockSetSocialMediaData,
      mockSetSentimentData,
      mockSetError,
      mockSetLoading
    );

    expect(mockSetError).toHaveBeenCalledWith('Error fetching data or analyzing sentiment. Please try again.');
    expect(mockSetSocialMediaData).toHaveBeenCalledWith([]);
    expect(mockSetSentimentData).not.toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  test('should not analyze sentiment if model is not provided', async () => {
    const mockData = [{ id: 1, text: 'Test post' }];
    mockApiClient.getSocialMediaData.mockResolvedValue(mockData);

    await fetchSocialMediaData(
      mockApiClient,
      null, // No model provided
      mockAnalyzeSentiment,
      mockSetSocialMediaData,
      mockSetSentimentData,
      mockSetError,
      mockSetLoading
    );

    expect(mockSetSocialMediaData).toHaveBeenCalledWith(mockData);
    expect(mockAnalyzeSentiment).not.toHaveBeenCalled();
    expect(mockSetSentimentData).not.toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
  test('should handle partial failure in sentiment analysis', async () => {
    const mockApiClient = {
      getSocialMediaData: jest.fn().mockResolvedValue([
        { id: 1, text: 'Great post!' },
        { id: 2, text: 'Terrible experience.' },
        { id: 3, text: 'Neutral statement.' }
      ])
    };
    const mockModel = {};
    const mockAnalyzeSentiment = jest.fn()
    mockAnalyzeSentiment
      .mockResolvedValueOnce({ score: 0.8, label: 'Positive' })
      .mockRejectedValueOnce(new Error('Analysis failed'))
      .mockResolvedValueOnce({ score: 0, label: 'Neutral' });
    const mockSetSocialMediaData = jest.fn();
    const mockSetSentimentData = jest.fn();
    const mockSetError = jest.fn();
    const mockSetLoading = jest.fn();
  
    await fetchSocialMediaData(
      mockApiClient,
      {}, // mock model
      mockAnalyzeSentiment,
      mockSetSocialMediaData,
      mockSetSentimentData,
      mockSetError,
      mockSetLoading
    );
  
    expect(mockSetSocialMediaData).toHaveBeenCalledWith([
      { id: 1, text: 'Great post!' },
      { id: 2, text: 'Terrible experience.' },
      { id: 3, text: 'Neutral statement.' }
    ]);
    expect(mockSetSentimentData).toHaveBeenCalledWith([
      { id: 1, text: 'Great post!', sentiment: { score: 0.8, label: 'Positive' } },
      { id: 2, text: 'Terrible experience.', sentiment: null },
      { id: 3, text: 'Neutral statement.', sentiment: { score: 0, label: 'Neutral' } }
    ]);
  });
});

describe('getFilteredAndSortedData function', () => {
  const mockData = [
    { id: 1, topic: 'Tech', date: '2023-08-25T10:00:00Z', likes: 50 },
    { id: 2, topic: 'Sports', date: '2023-08-26T11:00:00Z', likes: 30 },
    { id: 3, topic: 'Tech', date: '2023-08-27T12:00:00Z', likes: 40 },
    { id: 4, topic: 'Politics', date: '2023-08-28T13:00:00Z', likes: 60 },
    { id: 5, topic: 'Tech', date: '2023-08-29T14:00:00Z', likes: 20 },
  ];

  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2023-08-30T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should return an empty array for invalid input', () => {
    expect(getFilteredAndSortedData(null, {}, '')).toEqual([]);
    expect(getFilteredAndSortedData(undefined, {}, '')).toEqual([]);
    expect(getFilteredAndSortedData('not an array', {}, '')).toEqual([]);
  });

  test('should filter by topic', () => {
    const filters = { topic: 'Tech', dateRange: 'all' };
    const result = getFilteredAndSortedData(mockData, filters, 'date');
    expect(result).toHaveLength(3);
    expect(result.every(item => item.topic === 'Tech')).toBe(true);
  });

  test('should filter by date range', () => {
    const filters = { topic: 'All', dateRange: '7days' };
    const result = getFilteredAndSortedData(mockData, filters, 'date');
    expect(result).toHaveLength(5); // All posts are within 7 days
  });

  test('should filter by topic and date range', () => {
    const filters = { topic: 'Tech', dateRange: '7days' };
    const result = getFilteredAndSortedData(mockData, filters, 'date');
    expect(result).toHaveLength(3);
    expect(result.every(item => item.topic === 'Tech')).toBe(true);
  });

  test('should sort by date in descending order', () => {
    const filters = { topic: 'All', dateRange: 'all' };
    const result = getFilteredAndSortedData(mockData, filters, 'date');
    expect(result).toEqual([
      mockData[4], mockData[3], mockData[2], mockData[1], mockData[0]
    ]);
  });

  test('should sort by likes in descending order', () => {
    const filters = { topic: 'All', dateRange: 'all' };
    const result = getFilteredAndSortedData(mockData, filters, 'likes');
    expect(result).toEqual([
      mockData[3], mockData[0], mockData[2], mockData[1], mockData[4]
    ]);
  });

  test('should not sort if sortBy is invalid', () => {
    const filters = { topic: 'All', dateRange: 'all' };
    const result = getFilteredAndSortedData(mockData, filters, 'invalid');
    expect(result).toEqual(mockData);
  });

  test('should handle empty data array', () => {
    const filters = { topic: 'All', dateRange: 'all' };
    const result = getFilteredAndSortedData([], filters, 'date');
    expect(result).toEqual([]);
  });
});

describe('handleFilterChange function', () => {
  let mockSetFilters;

  beforeEach(() => {
    // Create a mock function for setFilters
    mockSetFilters = jest.fn();
  });

  test('should update filters correctly', () => {
    const newFilters = { topic: 'Tech' };
    
    handleFilterChange(mockSetFilters, newFilters);

    // Check if mockSetFilters was called
    expect(mockSetFilters).toHaveBeenCalled();

    // Get the callback function passed to mockSetFilters
    const setFiltersCallback = mockSetFilters.mock.calls[0][0];

    // Test the callback with a mock previous state
    const prevFilters = { dateRange: '7days', someOtherFilter: 'value' };
    const result = setFiltersCallback(prevFilters);

    // Check if the result is correct
    expect(result).toEqual({
      dateRange: '7days',
      someOtherFilter: 'value',
      topic: 'Tech'
    });
  });

  test('should handle empty newFilters object', () => {
    const newFilters = {};
    
    handleFilterChange(mockSetFilters, newFilters);

    expect(mockSetFilters).toHaveBeenCalled();

    const setFiltersCallback = mockSetFilters.mock.calls[0][0];
    const prevFilters = { topic: 'Sports', dateRange: '30days' };
    const result = setFiltersCallback(prevFilters);

    expect(result).toEqual(prevFilters);
  });

  test('should override existing filters with new values', () => {
    const newFilters = { topic: 'Politics', dateRange: 'all' };
    
    handleFilterChange(mockSetFilters, newFilters);

    expect(mockSetFilters).toHaveBeenCalled();

    const setFiltersCallback = mockSetFilters.mock.calls[0][0];
    const prevFilters = { topic: 'Tech', dateRange: '7days', sortBy: 'likes' };
    const result = setFiltersCallback(prevFilters);

    expect(result).toEqual({
      topic: 'Politics',
      dateRange: 'all',
      sortBy: 'likes'
    });
  });
});


describe('handleSortChange function', () => {
  let mockSetSortBy;

  beforeEach(() => {
    // Create a mock function for setSortBy
    mockSetSortBy = jest.fn();
  });

  test('should update sortBy correctly', () => {
    const newSortBy = 'date';
    
    handleSortChange(mockSetSortBy, newSortBy);

    // Check if mockSetSortBy was called with the correct argument
    expect(mockSetSortBy).toHaveBeenCalledWith('date');
  });

  test('should handle different sort criteria', () => {
    const sortCriteria = ['likes', 'comments', 'shares'];

    sortCriteria.forEach(criteria => {
      handleSortChange(mockSetSortBy, criteria);
      expect(mockSetSortBy).toHaveBeenCalledWith(criteria);
    });

    // Check that mockSetSortBy was called once for each sort criteria
    expect(mockSetSortBy).toHaveBeenCalledTimes(sortCriteria.length);
  });

  test('should handle empty string as sort criteria', () => {
    const newSortBy = '';
    
    handleSortChange(mockSetSortBy, newSortBy);

    expect(mockSetSortBy).toHaveBeenCalledWith('');
  });

  test('should handle null as sort criteria', () => {
    const newSortBy = null;
    
    handleSortChange(mockSetSortBy, newSortBy);

    expect(mockSetSortBy).toHaveBeenCalledWith(null);
  });
});

describe('handleCustomTextAnalysis function', () => {
  let mockAnalyzeSentiment;
  let mockModel;
  let mockSetCustomSentiment;
  let mockAddAlert;
  let originalGetElementById;

  beforeEach(() => {
    mockAnalyzeSentiment = jest.fn();
    mockModel = {};
    mockSetCustomSentiment = jest.fn();
    mockAddAlert = jest.fn();

    // Mock document.getElementById
    originalGetElementById = document.getElementById;
    document.getElementById = jest.fn();
  });

  afterEach(() => {
    // Restore original document.getElementById
    document.getElementById = originalGetElementById;
  });

  test('should analyze sentiment and set result when text is provided', async () => {
    document.getElementById.mockReturnValue({ value: 'This is a test text' });
    mockAnalyzeSentiment.mockResolvedValue({ label: 'Positive', score: 0.8 });

    await handleCustomTextAnalysis(mockAnalyzeSentiment, mockModel, mockSetCustomSentiment, mockAddAlert);

    expect(mockAnalyzeSentiment).toHaveBeenCalledWith(mockModel, 'This is a test text');
    expect(mockSetCustomSentiment).toHaveBeenCalledWith({ label: 'Positive', score: 0.8 });
    expect(mockAddAlert).toHaveBeenCalledWith('Sentiment analysis completed: Positive', 'success');
  });

  test('should handle empty text input', async () => {
    document.getElementById.mockReturnValue({ value: '' });

    await handleCustomTextAnalysis(mockAnalyzeSentiment, mockModel, mockSetCustomSentiment, mockAddAlert);

    expect(mockAnalyzeSentiment).not.toHaveBeenCalled();
    expect(mockSetCustomSentiment).not.toHaveBeenCalled();
    expect(mockAddAlert).toHaveBeenCalledWith('Please enter some text to analyze.', 'warning');
  });

  test('should handle invalid sentiment result', async () => {
    document.getElementById.mockReturnValue({ value: 'This is a test text' });
    mockAnalyzeSentiment.mockResolvedValue(null);

    await handleCustomTextAnalysis(mockAnalyzeSentiment, mockModel, mockSetCustomSentiment, mockAddAlert);

    expect(mockAnalyzeSentiment).toHaveBeenCalledWith(mockModel, 'This is a test text');
    expect(mockSetCustomSentiment).toHaveBeenCalledWith(null);
    expect(mockAddAlert).toHaveBeenCalledWith('Error during sentiment analysis. Please try again.', 'error');
  });

  test('should handle error during sentiment analysis', async () => {
    document.getElementById.mockReturnValue({ value: 'This is a test text' });
    mockAnalyzeSentiment.mockRejectedValue(new Error('Analysis failed'));

    await handleCustomTextAnalysis(mockAnalyzeSentiment, mockModel, mockSetCustomSentiment, mockAddAlert);

    expect(mockAnalyzeSentiment).toHaveBeenCalledWith(mockModel, 'This is a test text');
    expect(mockSetCustomSentiment).toHaveBeenCalledWith(null);
    expect(mockAddAlert).toHaveBeenCalledWith('Error during sentiment analysis. Please try again.', 'error');
  });
});

describe('addAlert function', () => {
  let mockSetAlerts;
  let originalDateNow;

  beforeEach(() => {
    mockSetAlerts = jest.fn();
    originalDateNow = Date.now;
    Date.now = jest.fn(() => 1234567890);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  test('should add a new alert with default type', () => {
    const message = 'Test alert';
    
    addAlert(mockSetAlerts, message);

    // Get the callback function passed to mockSetAlerts
    const setAlertsCallback = mockSetAlerts.mock.calls[0][0];

    // Test the callback with a mock previous state
    const prevAlerts = [];
    const result = setAlertsCallback(prevAlerts);

    expect(result).toEqual([
      {
        id: 1234567890,
        message: 'Test alert',
        type: 'info'
      }
    ]);
  });

  test('should add a new alert with specified type', () => {
    const message = 'Warning alert';
    const type = 'warning';
    
    addAlert(mockSetAlerts, message, type);

    const setAlertsCallback = mockSetAlerts.mock.calls[0][0];
    const prevAlerts = [];
    const result = setAlertsCallback(prevAlerts);

    expect(result).toEqual([
      {
        id: 1234567890,
        message: 'Warning alert',
        type: 'warning'
      }
    ]);
  });

  test('should add a new alert to existing alerts', () => {
    const message = 'Another alert';
    
    addAlert(mockSetAlerts, message);

    const setAlertsCallback = mockSetAlerts.mock.calls[0][0];
    const prevAlerts = [
      { id: 1111111111, message: 'Existing alert', type: 'success' }
    ];
    const result = setAlertsCallback(prevAlerts);

    expect(result).toEqual([
      { id: 1111111111, message: 'Existing alert', type: 'success' },
      { id: 1234567890, message: 'Another alert', type: 'info' }
    ]);
  });

  test('should use the provided type if specified', () => {
    const message = 'Error alert';
    const type = 'error';
    
    addAlert(mockSetAlerts, message, type);

    const setAlertsCallback = mockSetAlerts.mock.calls[0][0];
    const prevAlerts = [];
    const result = setAlertsCallback(prevAlerts);

    expect(result).toEqual([
      {
        id: 1234567890,
        message: 'Error alert',
        type: 'error'
      }
    ]);
  });
});


describe('removeAlert function', () => {
  let mockSetAlerts;

  beforeEach(() => {
    mockSetAlerts = jest.fn();
  });

  test('should remove the alert with the specified ID', () => {
    const alertIdToRemove = 2;
    
    removeAlert(mockSetAlerts, alertIdToRemove);

    // Get the callback function passed to mockSetAlerts
    const setAlertsCallback = mockSetAlerts.mock.calls[0][0];

    // Test the callback with a mock previous state
    const prevAlerts = [
      { id: 1, message: 'Alert 1', type: 'info' },
      { id: 2, message: 'Alert 2', type: 'warning' },
      { id: 3, message: 'Alert 3', type: 'error' }
    ];
    const result = setAlertsCallback(prevAlerts);

    expect(result).toEqual([
      { id: 1, message: 'Alert 1', type: 'info' },
      { id: 3, message: 'Alert 3', type: 'error' }
    ]);
  });

  test('should not modify the alerts if the specified ID is not found', () => {
    const nonExistentAlertId = 999;
    
    removeAlert(mockSetAlerts, nonExistentAlertId);

    const setAlertsCallback = mockSetAlerts.mock.calls[0][0];
    const prevAlerts = [
      { id: 1, message: 'Alert 1', type: 'info' },
      { id: 2, message: 'Alert 2', type: 'warning' }
    ];
    const result = setAlertsCallback(prevAlerts);

    expect(result).toEqual(prevAlerts);
  });

  test('should handle removing from an empty alert list', () => {
    const anyAlertId = 1;
    
    removeAlert(mockSetAlerts, anyAlertId);

    const setAlertsCallback = mockSetAlerts.mock.calls[0][0];
    const prevAlerts = [];
    const result = setAlertsCallback(prevAlerts);

    expect(result).toEqual([]);
  });

  test('should remove the correct alert when multiple alerts exist', () => {
    const alertIdToRemove = 2;
    
    removeAlert(mockSetAlerts, alertIdToRemove);

    const setAlertsCallback = mockSetAlerts.mock.calls[0][0];
    const prevAlerts = [
      { id: 1, message: 'Alert 1', type: 'info' },
      { id: 2, message: 'Alert 2', type: 'warning' },
      { id: 3, message: 'Alert 3', type: 'error' },
      { id: 4, message: 'Alert 4', type: 'success' }
    ];
    const result = setAlertsCallback(prevAlerts);

    expect(result).toEqual([
      { id: 1, message: 'Alert 1', type: 'info' },
      { id: 3, message: 'Alert 3', type: 'error' },
      { id: 4, message: 'Alert 4', type: 'success' }
    ]);
  });
});


describe('handleGoogleLogin function', () => {
  let originalWindowLocation;

  beforeEach(() => {
    // Store the original window.location
    originalWindowLocation = window.location;

    // Delete window.location to make it writable
    delete window.location;

    // Create a new object with a writable href property
    window.location = { href: '' };
  });

  afterEach(() => {
    // Restore the original window.location
    window.location = originalWindowLocation;
  });

  test('should redirect to the correct Google auth URL', () => {
    const API_BASE_URL = 'https://api.example.com';
    
    handleGoogleLogin(API_BASE_URL);

    expect(window.location.href).toBe('https://api.example.com/auth/google');
  });

  test('should handle API_BASE_URL without trailing slash', () => {
    const API_BASE_URL = 'https://api.example.com';
    
    handleGoogleLogin(API_BASE_URL);

    expect(window.location.href).toBe('https://api.example.com/auth/google');
  });

  test('should handle API_BASE_URL with trailing slash', () => {
    const API_BASE_URL = 'https://api.example.com/';
    
    handleGoogleLogin(API_BASE_URL);

    expect(window.location.href).toBe('https://api.example.com//auth/google');
  });

  test('should work with different API_BASE_URLs', () => {
    const API_BASE_URLS = [
      'http://localhost:3000',
      'https://staging-api.example.com',
      'https://production-api.example.com'
    ];

    API_BASE_URLS.forEach(url => {
      handleGoogleLogin(url);
      expect(window.location.href).toBe(`${url}/auth/google`);
    });
  });
});


describe('checkAuth function', () => {
  let mockApiClient;
  let mockSetUser;
  let consoleErrorSpy;

  beforeEach(() => {
    mockApiClient = {
      request: jest.fn()
    };
    mockSetUser = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should set user data when authentication is successful', async () => {
    const mockUserData = { id: 1, name: 'Test User' };
    mockApiClient.request.mockResolvedValue(mockUserData);

    await checkAuth(mockApiClient, mockSetUser);

    expect(mockApiClient.request).toHaveBeenCalledWith('/auth/user');
    expect(mockSetUser).toHaveBeenCalledWith(mockUserData);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('should handle authentication error', async () => {
    const mockError = new Error('Authentication failed');
    mockApiClient.request.mockRejectedValue(mockError);

    await checkAuth(mockApiClient, mockSetUser);

    expect(mockApiClient.request).toHaveBeenCalledWith('/auth/user');
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking authentication:', mockError);
  });

  test('should not set user data when API returns null', async () => {
    mockApiClient.request.mockResolvedValue(null);

    await checkAuth(mockApiClient, mockSetUser);

    expect(mockApiClient.request).toHaveBeenCalledWith('/auth/user');
    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('should handle network errors', async () => {
    const mockNetworkError = new Error('Network error');
    mockApiClient.request.mockRejectedValue(mockNetworkError);

    await checkAuth(mockApiClient, mockSetUser);

    expect(mockApiClient.request).toHaveBeenCalledWith('/auth/user');
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking authentication:', mockNetworkError);
  });
});

describe('handleLogout function', () => {
  let originalWindowLocation;
  let consoleLogSpy;
  let consoleErrorSpy;
  
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });

    originalWindowLocation = window.location;
    delete window.location;
    window.location = { href: '' };

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    window.location = originalWindowLocation;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('should handle successful logout', async () => {
    apiClient.request.mockResolvedValue({ message: 'Logged out successfully' });
    const mockSetUser = jest.fn();
    const mockSetError = jest.fn();

    await handleLogout(apiClient, mockSetUser, mockSetError);

    expect(apiClient.request).toHaveBeenCalledWith('/auth/logout', expect.any(Object));
    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
    expect(window.location.href).toBe('/login');
  });

  test('should handle failed logout response', async () => {
    const mockResponse = { message: 'Logout failed' };
    apiClient.request.mockResolvedValue(mockResponse);
    const mockSetUser = jest.fn();
    const mockSetError = jest.fn();

    await handleLogout(apiClient, mockSetUser, mockSetError);

    expect(apiClient.request).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('Logout response:', mockResponse);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', mockResponse);
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(window.localStorage.removeItem).not.toHaveBeenCalled();
    expect(window.location.href).not.toBe('/login');
    expect(mockSetError).toHaveBeenCalledWith('Logout failed. Please try again.');
  });

  test('should handle network error during logout', async () => {
    const mockError = new Error('Network error');
    apiClient.request.mockRejectedValue(mockError);
    const mockSetUser = jest.fn();
    const mockSetError = jest.fn();

    await handleLogout(apiClient, mockSetUser, mockSetError);

    expect(apiClient.request).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error logging out:', mockError);
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(window.localStorage.removeItem).not.toHaveBeenCalled();
    expect(window.location.href).not.toBe('/login');
    expect(mockSetError).toHaveBeenCalledWith('Error logging out. Please try again.');
  });
});

describe('apiClient', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.request.mockReset();
    apiClient.getSocialMediaData.mockReset();
  });

  test('should make a successful request', async () => {
    const mockResponse = { data: 'test' };
    apiClientMock.request.mockResolvedValueOnce(mockResponse);
    const result = await apiClient.request('/test');
    expect(result).toEqual(mockResponse);
  });

  test('should throw an error for unsuccessful requests', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    });
    await expect(apiClient.request('/test')).rejects.toThrow('API request failed: Not Found');
  });

  test('should call request with correct endpoint', async () => {
    const spy = jest.spyOn(apiClient, 'request');
    await apiClient.getAllItems();
    expect(spy).toHaveBeenCalledWith('/items');
  });

  test('should call request with correct endpoint and ID', async () => {
    const spy = jest.spyOn(apiClient, 'request');
    await apiClient.getItem(1);
    expect(spy).toHaveBeenCalledWith('/items/1');
  });

  test('should call request with correct endpoint and data', async () => {
    const spy = jest.spyOn(apiClient, 'request');
    await apiClient.createItem('New Item');
    expect(spy).toHaveBeenCalledWith('/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Item' })
    });
  });

  test('should call request with correct endpoint, ID, and data', async () => {
    const spy = jest.spyOn(apiClient, 'request');
    await apiClient.updateItem(1, 'Updated Item');
    expect(spy).toHaveBeenCalledWith('/items/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Item' })
    });
  });

  test('should call request with correct endpoint and ID', async () => {
    const spy = jest.spyOn(apiClient, 'request');
    await apiClient.deleteItem(1);
    expect(spy).toHaveBeenCalledWith('/items/1', { method: 'DELETE' });
  });
});

describe('getSocialMediaData', () => {
  
  test('should return cached data if it exists and is recent', async () => {
    const cachedData = { posts: ['post1', 'post2'] };
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'socialMediaData') return JSON.stringify(cachedData);
      if (key === 'socialMediaDataTime') return (Date.now() - 30000).toString();
    });
    const result = await apiClient.getSocialMediaData();
    expect(result).toEqual(cachedData);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('should fetch new data if cache is old', async () => {
    const oldCachedData = { posts: ['old1', 'old2'] };
    const newData = { posts: ['new1', 'new2'] };
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'socialMediaData') return JSON.stringify(oldCachedData);
      if (key === 'socialMediaDataTime') return (Date.now() - 70000).toString();
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newData)
    });

    const result = await apiClient.getSocialMediaData();
    expect(result).toEqual(expect.objectContaining(newData));
    expect(fetch).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith('socialMediaData', JSON.stringify(newData));
  });

  test('should fetch new data if cache does not exist', async () => {
    const newData = { posts: ['new1', 'new2'] };
    localStorage.getItem.mockReturnValue(null);
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newData)
    });

    const result = await apiClient.getSocialMediaData();
    expect(result).toEqual(newData);
    expect(fetch).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith('socialMediaData', JSON.stringify(newData));
  });

  test('should throw an error if fetching fails', async () => {
    localStorage.getItem.mockReturnValue(null);
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(apiClient.getSocialMediaData()).rejects.toThrow('Network error');
  });
  // Add more tests here as needed
});


