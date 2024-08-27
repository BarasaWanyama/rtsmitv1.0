import React from 'react';

function Sidebar({ onSectionChange, currentSection }) {
  const sections = ['Overview', 'Topic Distribution', 'Sentiment Analysis', 'Recent Posts'];

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {sections.map((section) => (
            <li key={section} className={currentSection === section ? 'active' : ''}>
              <button onClick={() => onSectionChange(section)}>{section}</button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
export default Sidebar;