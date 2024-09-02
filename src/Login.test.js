import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../src/components/Login';

describe('Login Component', () => {
  // Mock console.log to prevent it from cluttering the test output
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  test('renders login component', () => {
    render(<Login onGoogleLogin={() => {}} />);
    
    // Check if the login header is present
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Check if the Google login button is present
    expect(screen.getByText('Login with Google')).toBeInTheDocument();
  });

  test('calls onGoogleLogin when button is clicked', () => {
    const mockOnGoogleLogin = jest.fn();
    render(<Login onGoogleLogin={mockOnGoogleLogin} />);
    
    // Find the button and click it
    const loginButton = screen.getByText('Login with Google');
    fireEvent.click(loginButton);
    
    // Check if the onGoogleLogin function was called
    expect(mockOnGoogleLogin).toHaveBeenCalledTimes(1);
  });

  test('logs message when Google login button is clicked', () => {
    render(<Login onGoogleLogin={() => {}} />);
    
    // Find the button and click it
    const loginButton = screen.getByText('Login with Google');
    fireEvent.click(loginButton);
    
    // Check if the console.log was called with the correct message
    expect(console.log).toHaveBeenCalledWith('Google login button clicked');
  });

  test('has correct CSS class', () => {
    const { container } = render(<Login onGoogleLogin={() => {}} />);
    
    // Check if the main div has the correct CSS class
    expect(container.firstChild).toHaveClass('login-container');
  });

  test('button is not disabled', () => {
    render(<Login onGoogleLogin={() => {}} />);
    
    const loginButton = screen.getByText('Login with Google');
    expect(loginButton).not.toBeDisabled();
  });
});