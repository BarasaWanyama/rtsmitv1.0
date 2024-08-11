import React from 'react';
import './Dashboard.css';
import TopicPieChart from './TopicPieChart';

const Dashboard = ({
  socialMediaData,
  sentimentData,
  filters,
  sortBy,
  onFilterChange,
  onSortChange
}) => {
  // Calculate metrics based on the new data structure
  const totalPosts = socialMediaData.length;
  const totalLikes = socialMediaData.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalHashtags = socialMediaData.reduce((sum, post) => sum + (post.hashtags?.length || 0), 0);

  // Calculate topic counts
  const topicCounts = socialMediaData.reduce((counts, post) => {
    counts[post.topic] = (counts[post.topic] || 0) + 1;
    return counts;
  }, {});

  return (
    <div className="dashboard">
      <h2>Social Media Dashboard</h2>
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
      <div className="metrics">
        <div className="metric">
          <h3>Total Posts</h3>
          <p>{totalPosts}</p>
        </div>
        <div className="metric">
          <h3>Total Likes</h3>
          <p>{totalLikes}</p>
        </div>
        <div className="metric">
          <h3>Total Hashtags</h3>
          <p>{totalHashtags}</p>
        </div>
      </div>
      <div className="topic-distribution">
        <h3>Posts by Topic</h3>
        <ul>
          {Object.entries(topicCounts).map(([topic, count]) => (
            <li key={topic}>{topic}: {count}</li>
          ))}
        </ul>
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
      <div className="recent-posts">
        <h3>Recent Posts</h3>
        <ul>
          {socialMediaData.slice(0, 5).map((post, index) => (
            <li key={index}>
              <p>{post.text}</p>
              <p>Likes: {post.likes} | Hashtags: {post.hashtags?.length || 0} | Topic: {post.topic}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="topic-distribution">
        <h3>Posts by Topic</h3>
        <TopicPieChart topicCounts={topicCounts} />
      </div>
    </div>
  );
};

export default Dashboard;