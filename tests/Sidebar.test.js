import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../src/components/Sidebar';

describe('Sidebar Component', () => {
  const mockOnSectionChange = jest.fn();
  const defaultProps = {
    onSectionChange: mockOnSectionChange,
    currentSection: 'Overview'
  };

  beforeEach(() => {
    mockOnSectionChange.mockClear();
  });

  test('renders all sections', () => {
    render(<Sidebar {...defaultProps} />);
    const sections = ['Overview', 'Topic Distribution', 'Sentiment Analysis', 'Recent Posts'];
    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  test('applies active class to current section', () => {
    render(<Sidebar {...defaultProps} />);
    const activeButton = screen.getByText('Overview');
    expect(activeButton.closest('li')).toHaveClass('active');
  });

  test('does not apply active class to non-current sections', () => {
    render(<Sidebar {...defaultProps} />);
    const inactiveButton = screen.getByText('Topic Distribution');
    expect(inactiveButton.closest('li')).not.toHaveClass('active');
  });

  test('calls onSectionChange with correct section when button is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    const topicDistributionButton = screen.getByText('Topic Distribution');
    fireEvent.click(topicDistributionButton);
    expect(mockOnSectionChange).toHaveBeenCalledWith('Topic Distribution');
  });

  test('renders inside an aside element with correct class', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const asideElement = container.querySelector('aside');
    expect(asideElement).toBeInTheDocument();
    expect(asideElement).toHaveClass('sidebar');
  });

  test('renders a nav element', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const navElement = container.querySelector('nav');
    expect(navElement).toBeInTheDocument();
  });

  test('renders an unordered list', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const ulElement = container.querySelector('ul');
    expect(ulElement).toBeInTheDocument();
  });

  test('changes active section when a different section is selected', () => {
    const { rerender } = render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Overview').closest('li')).toHaveClass('active');

    rerender(<Sidebar {...defaultProps} currentSection="Topic Distribution" />);
    expect(screen.getByText('Topic Distribution').closest('li')).toHaveClass('active');
    expect(screen.getByText('Overview').closest('li')).not.toHaveClass('active');
  });
});