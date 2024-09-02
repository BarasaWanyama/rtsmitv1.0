import React from 'react';
import { render, screen } from '@testing-library/react';
import { TopicPieChart } from './components/TopicPieChart';

// Mock the recharts library
jest.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('TopicPieChart Component', () => {
  // Mock console.log and console.error to prevent cluttering the test output
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  test('renders no data message when topicCounts is empty', () => {
    render(<TopicPieChart topicCounts={{}} />);
    expect(screen.getByText('No data available for the pie chart')).toBeInTheDocument();
  });

  test('renders chart components when topicCounts has data', () => {
    const mockTopicCounts = { Tech: 5, Sports: 3, Politics: 2 };
    render(<TopicPieChart topicCounts={mockTopicCounts} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  test('renders correct number of cells based on topicCounts', () => {
    const mockTopicCounts = { Tech: 5, Sports: 3, Politics: 2 };
    render(<TopicPieChart topicCounts={mockTopicCounts} />);

    const cells = screen.getAllByTestId('cell');
    expect(cells).toHaveLength(Object.keys(mockTopicCounts).length);
  });

  test('logs error when topicCounts is null', () => {
    render(<TopicPieChart topicCounts={null} />);
    expect(console.error).toHaveBeenCalledWith('topicCounts is null, undefined, or not an object');
  });

  test('logs error when topicCounts is undefined', () => {
    render(<TopicPieChart topicCounts={undefined} />);
    expect(console.error).toHaveBeenCalledWith('topicCounts is null, undefined, or not an object');
  });

  test('logs error when topicCounts is not an object', () => {
    render(<TopicPieChart topicCounts="not an object" />);
    expect(console.error).toHaveBeenCalledWith('topicCounts is null, undefined, or not an object');
  });

  test('logs component rendering with topicCounts', () => {
    const mockTopicCounts = { Tech: 5, Sports: 3 };
    render(<TopicPieChart topicCounts={mockTopicCounts} />);
    expect(console.log).toHaveBeenCalledWith('TopicPieChart rendering with topicCounts:', mockTopicCounts);
  });
});