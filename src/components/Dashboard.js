import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { TopicPieChart } from './TopicPieChart';
import Header from './Header';
import Sidebar from './Sidebar';

export const Dashboard = ({
  socialMediaData,
  sentimentData,
  filters,
  sortBy,
  onFilterChange,
  onSortChange
}) => {
  console.log('Dashboard component loaded');
  const [currentSection, setCurrentSection] = useState('Overview');

  // Calculate metrics based on the data structure
  const totalPosts = socialMediaData.length;
  const totalLikes = socialMediaData.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalHashtags = socialMediaData.reduce((sum, post) => sum + (post.hashtags?.length || 0), 0);
  const avgLikes = totalPosts > 0 ? totalLikes / totalPosts : 0;

  // Calculate topic counts
  const topicCounts = socialMediaData.reduce((counts, post) => {
    counts[post.topic] = (counts[post.topic] || 0) + 1;
    return counts;
  }, {});

  // Log changes to Dashboard props for debugging
  useEffect(() => {
    console.log('Dashboard props updated:', {
      socialMediaData,
      sentimentData,
      filters,
      sortBy
    });
  }, [socialMediaData, sentimentData, filters, sortBy]);

  const renderSection = () => {
    // Implement this function based on your requirements
    return <div>Content for {currentSection}</div>;
  };

  return (
    <div className="dashboard-container">
      <Header totalPosts={totalPosts} avgLikes={avgLikes.toFixed(2)} />
      <div className="dashboard-content">
        <Sidebar onSectionChange={setCurrentSection} currentSection={currentSection} />
        <main className="dashboard-main">
          {renderSection()}
        </main>
      </div>
      <div className="dashboard-controls">
        <div className="filter-control">
          <label htmlFor="topic-filter">Filter by Topic:</label>
          <select
            id="topic-filter"
            value={filters.topic}
            onChange={(e) => onFilterChange({ topic: e.target.value })}
          >
            <option value="All">All Topics</option>
            {Object.keys(topicCounts).map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
        <div className="filter-control">
          <label htmlFor="date-filter">Filter by Date:</label>
          <select
            id="date-filter"
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ dateRange: e.target.value })}
          >
            <option value="7days">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="sort-control">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="date">Date</option>
            <option value="likes">Likes</option>
          </select>
        </div>
      </div>
      <div className="sentiment-analysis">
        <h3>Sentiment Analysis</h3>
        {sentimentData && (
          <ul>
            <li>Positive: {sentimentData.filter(item => item.sentiment.label === 'Positive').length}</li>
            <li>Neutral: {sentimentData.filter(item => item.sentiment.label === 'Neutral').length}</li>
            <li>Negative: {sentimentData.filter(item => item.sentiment.label === 'Negative').length}</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;