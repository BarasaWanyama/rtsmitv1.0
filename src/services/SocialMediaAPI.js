// SocialMediaAPI.js

import { useState, useEffect } from 'react';
import dotenv from 'dotenv';
dotenv.config();

const API_ENDPOINTS = {
  facebook: process.env.FACEBOOK_API_URL,
  linkedin: process.env.LINKEDIN_API_URL,
  platformX: process.env.PLATFORM_X_API_URL
};

const API_KEYS = {
  facebook: process.env.FACEBOOK_API_KEY,
  linkedin: process.env.LINKEDIN_API_KEY,
  platformX: process.env.PLATFORM_X_API_KEY
};

async function fetchApiData(url, params) {
  const response = await fetch(url + new URLSearchParams(params));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

const SocialMediaAPI = {
  getData: async () => {
    try {
      const response = await fetch('/api/social-media-data', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw new Error('Failed to fetch social media data. Please try again later.');
    }
  }
};
// React component to fetch and display social media data
export function SocialMediaComponent() {
  const [socialMediaData, setSocialMediaData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await SocialMediaAPI.getData();
        setSocialMediaData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch social media data. Please try again later.');
      }
    }
    fetchData();
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <h2>Social Media Data from APIs</h2>
      {socialMediaData.length === 0 ? (
        <p>Loading data...</p>
      ) : (
        <ul>
          {socialMediaData.map((item, index) => (
            <li key={index}>
              <h3>{item.platform}</h3>
              <pre>{JSON.stringify(item.data, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SocialMediaAPI;