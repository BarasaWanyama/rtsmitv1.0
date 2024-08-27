import React from 'react';

function Header({ totalPosts, avgLikes }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Social Media Dashboard</h1>
        <div className="dashboard-summary">
          <span>Total Posts: {totalPosts}</span>
          <span>Average Likes: {avgLikes}</span>
        </div>
      </div>
    </header>
  );
}
export default Header;