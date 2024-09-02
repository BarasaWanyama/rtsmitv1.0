import React from 'react';
import { render, screen } from '@testing-library/react';
import { TopicPieChart } from './components/TopicPieChart';

const mockData = {
  Tech: 5,
  Sports: 3,
  Politics: 2,
};

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
    render(<TopicPieChart topicCounts={mockData} />);
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Politics')).toBeInTheDocument();
    });

  test('renders correct number of cells based on topicCounts', () => {
    render(<TopicPieChart topicCounts={mockData} />);
    const cells = screen.getAllByRole('cell'); // Assuming each slice is a cell
    expect(cells).toHaveLength(Object.keys(mockData).length);
  });

  test('logs error when topicCounts is null', () => {
    console.error = jest.fn();
    render(<TopicPieChart topicCounts={null} />);
    expect(console.error).toHaveBeenCalled();
  });

  test('logs error when topicCounts is undefined', () => {
    console.error = jest.fn();
    render(<TopicPieChart topicCounts={undefined} />);
    expect(console.error).toHaveBeenCalled();
  });

  test('logs component rendering with topicCounts', () => {
    console.log = jest.fn();
    render(<TopicPieChart topicCounts={mockData} />);
    expect(console.log).toHaveBeenCalledWith('TopicPieChart component loaded');
  });
});