import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../src/components/Header';

describe('Header Component', () => {
  const defaultProps = {
    totalPosts: 100,
    avgLikes: 50.5
  };

  test('renders the header with correct title', () => {
    render(<Header {...defaultProps} />);
    const headerElement = screen.getByRole('heading', { level: 1 });
    expect(headerElement).toHaveTextContent('Social Media Dashboard');
  });

  test('displays correct total posts', () => {
    render(<Header {...defaultProps} />);
    const totalPostsElement = screen.getByText(/Total Posts:/);
    expect(totalPostsElement).toHaveTextContent('Total Posts: 100');
  });

  test('displays correct average likes', () => {
    render(<Header {...defaultProps} />);
    const avgLikesElement = screen.getByText(/Average Likes:/);
    expect(avgLikesElement).toHaveTextContent('Average Likes: 50.5');
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<Header {...defaultProps} />);
    expect(container.firstChild).toHaveClass('header');
    expect(container.querySelector('.header-content')).toBeInTheDocument();
    expect(container.querySelector('.dashboard-summary')).toBeInTheDocument();
  });

  test('renders with different prop values', () => {
    const newProps = {
      totalPosts: 250,
      avgLikes: 75.25
    };
    render(<Header {...newProps} />);
    expect(screen.getByText('Total Posts: 250')).toBeInTheDocument();
    expect(screen.getByText('Average Likes: 75.25')).toBeInTheDocument();
  });

  test('handles zero values correctly', () => {
    const zeroProps = {
      totalPosts: 0,
      avgLikes: 0
    };
    render(<Header {...zeroProps} />);
    expect(screen.getByText('Total Posts: 0')).toBeInTheDocument();
    expect(screen.getByText('Average Likes: 0')).toBeInTheDocument();
  });
});