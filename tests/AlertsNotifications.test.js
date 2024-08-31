import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertsNotifications from '../src/components/AlertsNotifications';

describe('AlertsNotifications', () => {
  const mockAlerts = [
    { id: 1, type: 'success', message: 'Operation successful' },
    { id: 2, type: 'error', message: 'An error occurred' },
    { id: 3, type: 'warning', message: 'Warning: Low disk space' }
  ];

  const mockRemoveAlert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders alerts correctly', () => {
    render(<AlertsNotifications alerts={mockAlerts} removeAlert={mockRemoveAlert} />);

    mockAlerts.forEach(alert => {
      expect(screen.getByText(alert.message)).toBeInTheDocument();
      expect(screen.getByText(alert.message).closest('div')).toHaveClass(`alert-${alert.type}`);
    });
  });

  test('calls removeAlert when close button is clicked', () => {
    render(<AlertsNotifications alerts={mockAlerts} removeAlert={mockRemoveAlert} />);

    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[1]); // Click the second close button

    expect(mockRemoveAlert).toHaveBeenCalledTimes(1);
    expect(mockRemoveAlert).toHaveBeenCalledWith(2);
  });

  test('renders nothing when there are no alerts', () => {
    const { container } = render(<AlertsNotifications alerts={[]} removeAlert={mockRemoveAlert} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  test('applies correct CSS classes', () => {
    render(<AlertsNotifications alerts={mockAlerts} removeAlert={mockRemoveAlert} />);

    const alertsContainer = screen.getByRole('alert').parentElement;
    expect(alertsContainer).toHaveClass('alerts-container');

    mockAlerts.forEach(alert => {
      const alertElement = screen.getByText(alert.message).closest('div');
      expect(alertElement).toHaveClass('alert', `alert-${alert.type}`);
    });
  });
});