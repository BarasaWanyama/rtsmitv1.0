import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import App from './App';
import { act } from 'react-dom/test-utils';

// Mock the TensorFlow and USE modules
jest.mock('@tensorflow/tfjs');
jest.mock('@tensorflow-models/universal-sentence-encoder');

// Mock child components
jest.mock('./components/Dashboard', () => () => <div data-testid="mock-dashboard">Dashboard</div>);
jest.mock('./components/AlertsNotifications', () => ({ alerts, removeAlert }) => (
  <div data-testid="mock-alerts-notifications">
    Alerts: {alerts.length}
    <button onClick={() => removeAlert(alerts[0].id)}>Remove Alert</button>
  </div>
));
jest.mock('./components/Login', () => ({ onGoogleLogin }) => (
  <div data-testid="mock-login">
    <button onClick={onGoogleLogin}>Google Login</button>
  </div>
));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ posts: [{ id: 1, text: 'Test post' }] }),
  })
);

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders without crashing', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
    });
    expect(screen.getByText('Real-Time Social Media Impact Tracker')).toBeInTheDocument();
  });

  test('fetches social media data on mount', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
    });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/social-media-posts'), expect.any(Object));
  });

  test('handles Google login', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
    });
    const loginButton = screen.getByText('Google Login');
    fireEvent.click(loginButton);
    expect(window.location.href).toContain('/auth/google');
  });

  test('performs sentiment analysis on custom text', async () => {
    use.load.mockResolvedValue({
      embed: jest.fn().mockResolvedValue(tf.tensor2d([[1, 2, 3]])),
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
    });

    const textarea = screen.getByPlaceholderText('Enter text to analyze sentiment');
    const analyzeButton = screen.getByText('Analyze Sentiment');

    fireEvent.change(textarea, { target: { value: 'This is a test.' } });
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Sentiment Analysis Result:')).toBeInTheDocument();
    });
  });

  test('adds and removes alerts', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
    });

    // Trigger an action that adds an alert (e.g., sentiment analysis)
    const textarea = screen.getByPlaceholderText('Enter text to analyze sentiment');
    const analyzeButton = screen.getByText('Analyze Sentiment');

    fireEvent.change(textarea, { target: { value: 'This is a test.' } });
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-alerts-notifications')).toHaveTextContent('Alerts: 1');
    });

    // Remove the alert
    const removeButton = screen.getByText('Remove Alert');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByTestId('mock-alerts-notifications')).toHaveTextContent('Alerts: 0');
    });
  });

  test('handles logout', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ displayName: 'Test User' }),
      })
    ).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Logged out successfully' }),
      })
    );

    await act(async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.any(Object));
    expect(window.location.href).toContain('/login');
  });
});