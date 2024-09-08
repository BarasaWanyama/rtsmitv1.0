import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { TopicPieChart } from './TopicPieChart.js';
import Header from './Header.js';
import Sidebar from './Sidebar.js';

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
  const topicCounts = React.useMemo(() => {
    if (!socialMediaData || !Array.isArray(socialMediaData)) {
      console.log('socialMediaData is not an array or is undefined');
      return {};
    }
    return socialMediaData.reduce((counts, post) => {
      if (post && post.topic) {
        counts[post.topic] = (counts[post.topic] || 0) + 1;
      }
      return counts;
    }, {});
  }, [socialMediaData]);
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
    switch (currentSection) {
      case 'Overview':
  return (
    <div className="overview-section">
      <h2>Overview</h2>
      <div className="metrics-grid">
              <div className="metric-card">
                <h3>Total Posts</h3>
                <p>{totalPosts}</p>
                </div>
                <div className="metric-card">
                  <h3>Total Likes</h3>
                  <p>{totalLikes}</p>
                </div>
                <div className="metric-card">
                  <h3>Average Likes</h3>
                  <p>{avgLikes.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                  <h3>Total Hashtags</h3>
                  <p>{totalHashtags}</p>
                </div>
              </div>
              <TopicPieChart topicCounts={topicCounts} />
            </div>
          );
        case 'Posts':
          return (
            <div className="posts-section">
              <h2>Recent Posts</h2>
              <ul className="post-list">
                {socialMediaData.slice(0, 10).map((post, index) => (
                  <li key={index} className="post-item">
                    <h3>{post.title}</h3>
                    <p>{post.content}</p>
                    <div className="post-meta">
                      <span>Likes: {post.likes}</span>
                      <span>Topic: {post.topic}</span>
                      <span>Date: {new Date(post.date).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        case 'Sentiment':
          return (
            <div className="sentiment-section">
              <h2>Sentiment Analysis</h2>
              {sentimentData && (
                <div className="sentiment-chart">
                  <div className="sentiment-bar positive" style={{width: `${(sentimentData.filter(item => item.sentiment.label === 'Positive').length / sentimentData.length) * 100}%`}}>
                    Positive: {sentimentData.filter(item => item.sentiment.label === 'Positive').length}
                  </div>
                  <div className="sentiment-bar neutral" style={{width: `${(sentimentData.filter(item => item.sentiment.label === 'Neutral').length / sentimentData.length) * 100}%`}}>
                    Neutral: {sentimentData.filter(item => item.sentiment.label === 'Neutral').length}
                  </div>
                  <div className="sentiment-bar negative" style={{width: `${(sentimentData.filter(item => item.sentiment.label === 'Negative').length / sentimentData.length) * 100}%`}}>
                    Negative: {sentimentData.filter(item => item.sentiment.label === 'Negative').length}
                  </div>
                </div>
              )}
            </div>
          );
        
        default:
          return <div>Select a section to view content</div>;
      }
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