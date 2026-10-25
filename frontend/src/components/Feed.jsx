import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import CreatePost from './CreatePost';
import PostItem from './PostItem';
import Leaderboard from './Leaderboard';
import SavedLetters from './SavedLetters';

const CATEGORIES = [
  'All',
  'Academics',
  'Hackathons & Tech',
  'Club & Cultural',
  'Peer Mentorship',
  'Campus Life'
];

export default function Feed({ activeTab = 'feed', onRequireAuth }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('trending');

  // Fetch letters with search, category & sort params
  const fetchLetters = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        sort: sortOption
      };
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get('/letters', { params });
      setLetters(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch letters:', err);
      setError('Unable to load shoutout board. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortOption]);

  useEffect(() => {
    if (activeTab === 'feed') {
      const timer = setTimeout(() => {
        fetchLetters();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [fetchLetters, activeTab]);

  const handleLetterCreated = (newLetter) => {
    setLetters((prev) => [newLetter, ...prev]);
  };

  const handleUpdateLetter = (updatedLetter) => {
    setLetters((prev) =>
      prev.map((letter) => (letter._id === updatedLetter._id ? updatedLetter : letter))
    );
  };

  const handleDeleteLetter = (deletedId) => {
    setLetters((prev) => prev.filter((letter) => letter._id !== deletedId));
  };

  // Render Leaderboard tab
  if (activeTab === 'leaderboard') {
    return (
      <main className="main-feed-container">
        <Leaderboard />
      </main>
    );
  }

  // Render Saved tab
  if (activeTab === 'saved') {
    return (
      <main className="main-feed-container">
        <SavedLetters onRequireAuth={onRequireAuth} />
      </main>
    );
  }

  return (
    <main className="main-feed-container">
      {/* Create Shoutout / Letter Section */}
      <CreatePost
        onLetterCreated={handleLetterCreated}
        onRequireAuth={onRequireAuth}
      />

      {/* Discovery, Search & Filtering Header */}
      <div className="feed-card filter-container-card">
        {/* Search Field */}
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="feed-search-input"
            placeholder="Search by recipient name, peer, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="category-scroll-container">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sorting Tabs */}
        <div className="sort-tabs-row">
          <span className="sort-label">Sort:</span>
          <button
            className={`sort-tab-btn ${sortOption === 'trending' ? 'active' : ''}`}
            onClick={() => setSortOption('trending')}
          >
            🔥 Trending
          </button>
          <button
            className={`sort-tab-btn ${sortOption === 'latest' ? 'active' : ''}`}
            onClick={() => setSortOption('latest')}
          >
            ⏱️ Latest
          </button>
          <button
            className={`sort-tab-btn ${sortOption === 'impact' ? 'active' : ''}`}
            onClick={() => setSortOption('impact')}
          >
            ⭐ Top Impact
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="error-banner" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Active Filter Indicator */}
      {(selectedCategory !== 'All' || searchQuery.trim()) && (
        <div className="active-filter-banner">
          <span>
            Filtering by: {selectedCategory !== 'All' ? `"${selectedCategory}"` : ''}{selectedCategory !== 'All' && searchQuery.trim() ? ' • ' : ''}{searchQuery.trim() ? `"${searchQuery.trim()}"` : ''}
          </span>
          <button
            className="btn-text-sm"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className="spinner-container">
          <p>Loading campus shoutouts...</p>
        </div>
      ) : letters.length === 0 ? (
        /* Empty Feed State */
        <div className="empty-feed">
          <h4>No Shoutouts Found</h4>
          <p>
            {searchQuery || selectedCategory !== 'All'
              ? 'Try clearing your search query or choosing another category filter.'
              : 'Be the first one to appreciate someone on campus!'}
          </p>
        </div>
      ) : (
        /* Letters Feed Stream */
        <div className="feed-stream">
          {letters.map((letter) => (
            <PostItem
              key={letter._id}
              letter={letter}
              onUpdateLetter={handleUpdateLetter}
              onDeleteLetter={handleDeleteLetter}
              onRequireAuth={onRequireAuth}
            />
          ))}
        </div>
      )}
    </main>
  );
}
