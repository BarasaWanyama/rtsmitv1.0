import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SocialMediaComponent } from '../src/services/SocialMediaAPI';
import SocialMediaAPI from './services/SocialMediaAPI';

// Mock the fetch function
global.fetch = jest.fn();

describe('SocialMediaAPI', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should fetch data successfully', async () => {
    const mockData = [{ platform: 'Facebook', data: { likes: 100 } }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await SocialMediaAPI.getData();
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/social-media-data', { credentials: 'include' });
  });

  it('should throw an error when the fetch fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(SocialMediaAPI.getData()).rejects.toThrow('Failed to fetch social media data. Please try again later.');
  });
});

describe('SocialMediaComponent', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should render loading state initially', () => {
    render(<SocialMediaComponent />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render data when fetch is successful', async () => {
    const mockData = [
      { platform: 'Facebook', data: { likes: 100 } },
      { platform: 'LinkedIn', data: { connections: 500 } },
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<SocialMediaComponent />);

    await waitFor(() => {
      expect(screen.getByText('Facebook')).toBeInTheDocument();
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByText(/"likes": 100/)).toBeInTheDocument();
      expect(screen.getByText(/"connections": 500/)).toBeInTheDocument();
    });
  });

  it('should render error message when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<SocialMediaComponent />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch social media data. Please try again later.')).toBeInTheDocument();
    });
  });

  it('should render the correct number of list items', async () => {
    const mockData = [
      { platform: 'Facebook', data: { likes: 100 } },
      { platform: 'LinkedIn', data: { connections: 500 } },
      { platform: 'Twitter', data: { followers: 1000 } },
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<SocialMediaComponent />);

    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });
  });
});