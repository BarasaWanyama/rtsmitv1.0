import React, { useEffect, useState } from 'react';

// WebSocket module
function WebSocketModule() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Establish WebSocket connection when component mounts
    const socket = new WebSocket('ws://your-websocket-server-url');

    // Event listeners for WebSocket events
    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      // Handle incoming messages from WebSocket server
      const newMessage = event.data;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    socket.onerror = (error) => {
      // Handle WebSocket errors
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      // Handle WebSocket close event
      console.log('WebSocket disconnected');
    };

    // Cleanup function to close WebSocket connection when component unmounts
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h2>Real-time Data with WebSockets</h2>
      <ul>
        {/* Render messages received from WebSocket */}
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

// API module
function SocialMediaAPI() {
  const [socialMediaData, setSocialMediaData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch data from Facebook API
        const facebookResponse = await fetch('https://graph.facebook.com/v12.0/me?access_token=YOUR_FACEBOOK_API_KEY');
        const facebookData = await facebookResponse.json();

        // Fetch data from LinkedIn API
        const linkedInResponse = await fetch('https://api.linkedin.com/v2/me?oauth2_access_token=YOUR_LINKEDIN_API_KEY');
        const linkedInData = await linkedInResponse.json();

        // Fetch data from Platform X API
        const platformXResponse = await fetch('https://api.platform-x.com/v1/data?api_key=YOUR_PLATFORM_X_API_KEY');
        const platformXData = await platformXResponse.json();

        // Combine data from all APIs
        const combinedData = [facebookData, linkedInData, platformXData];
        setSocialMediaData(combinedData);
      } catch (error) {
        // Handle errors during API fetching
        console.error('Error fetching data:', error);
      }
    }

    // Call the fetchData function when component mounts
    fetchData();
  }, []);

  return (
    <div>
      <h2>Social Media Data from APIs</h2>
      <ul>
        {/* Render social media data fetched from APIs */}
        {socialMediaData.map((item, index) => (
          <li key={index}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
}

// Main component
function App() {
  return (
    <div>
      {/* Render WebSocket module */}
      <WebSocketModule />
      {/* Render SocialMediaAPI module */}
      <SocialMediaAPI />
    </div>
  );
}

export default App;
