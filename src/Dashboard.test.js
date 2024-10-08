import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './components/Dashboard';

// Mock child components
jest.mock('../src/components/TopicPieChart', () => ({
  TopicPieChart: () => <div data-testid="topic-pie-chart">Mocked Topic Pie Chart</div>
}));
jest.mock('../src/components/Header', () => ({
  __esModule: true,
  default: ({ totalPosts, avgLikes }) => (
    <header data-testid="header">
      Total Posts: {totalPosts}, Avg Likes: {avgLikes}
    </header>
  )
}));
jest.mock('../src/components/Sidebar', () => ({
  __esModule: true,
  default: ({ onSectionChange, currentSection }) => (
    <nav data-testid="sidebar">
      <button onClick={() => onSectionChange('Overview')}>Overview</button>
      <button onClick={() => onSectionChange('Posts')}>Posts</button>
      <button onClick={() => onSectionChange('Sentiment')}>Sentiment</button>
    </nav>
  )
}));

describe('Dashboard Component', () => {
  const mockProps = {
    socialMediaData: [
      { id: 1, title: 'Post 1', content: 'Content 1', likes: 10, topic: 'Tech', date: '2023-01-01T00:00:00Z' },
      { id: 2, title: 'Post 2', content: 'Content 2', likes: 20, topic: 'Sports', date: '2023-01-02T00:00:00Z' }
    ],
    sentimentData: [
      { sentiment: { label: 'Positive' } },
      { sentiment: { label: 'Neutral' } },
      { sentiment: { label: 'Negative' } }
    ],
    filters: { topic: 'All', dateRange: '7days' },
    sortBy: 'date',
    onFilterChange: jest.fn(),
    onSortChange: jest.fn()
  };

  test('renders dashboard with correct initial state', () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });

  test('displays correct metrics in overview section', () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByText('Total Posts')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total posts
    expect(screen.getByText('Total Likes')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument(); // Total likes
    expect(screen.getByText('Average Likes')).toBeInTheDocument();
    expect(screen.getByText('15.00')).toBeInTheDocument(); // Average likes
  });

  test('renders TopicPieChart component', () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByTestId('topic-pie-chart')).toBeInTheDocument();
  });

  test('changes section when sidebar buttons are clicked', () => {
    render(<Dashboard {...mockProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Posts' }));
  expect(screen.getByRole('heading', { name: 'Recent Posts' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sentiment' }));
  expect(screen.getAllByRole('heading', { name: 'Sentiment Analysis' })[0]).toBeInTheDocument();
  });

  test('renders correct number of posts in Posts section', () => {
    render(<Dashboard {...mockProps} />);
    fireEvent.click(screen.getByText('Posts'));
    const postItems = screen.getAllByRole('listitem').filter(item => item.classList.contains('post-item'));
    expect(postItems).toHaveLength(2);
  });

  test('displays sentiment data correctly', () => {
    render(<Dashboard {...mockProps} />);
    fireEvent.click(screen.getByText('Sentiment'));
    expect(screen.getAllByText(/Positive: 1/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Neutral: 1/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Negative: 1/i)[0]).toBeInTheDocument();
  });

  test('calls onFilterChange when topic filter is changed', () => {
    render(<Dashboard {...mockProps} />);
    fireEvent.change(screen.getByRole('combobox', { name: /Filter by Topic/i }), { target: { value: 'Tech' } });
    expect(mockProps.onFilterChange).toHaveBeenCalledWith({ topic: 'Tech' });
  });

  test('calls onFilterChange when date filter is changed', () => {
    render(<Dashboard {...mockProps} />);
    fireEvent.change(screen.getByRole('combobox', { name: /Filter by Date/i }), { target: { value: 'all' } });
    expect(mockProps.onFilterChange).toHaveBeenCalledWith({ dateRange: 'all' });
  });

  test('calls onSortChange when sort option is changed', () => {
    render(<Dashboard {...mockProps} />);
    fireEvent.change(screen.getByRole('combobox', { name: /Sort by/i }), { target: { value: 'likes' } });
    expect(mockProps.onSortChange).toHaveBeenCalledWith('likes');
  });
});