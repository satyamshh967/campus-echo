import React, { useEffect, useState } from 'react';
import api from '../api/client';
import PostItem from './PostItem';

export default function SavedLetters({ onRequireAuth }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedLetters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/letters/saved');
      setLetters(res.data || []);
    } catch (err) {
      console.error('Failed to load saved letters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedLetters();
  }, []);

  const handleUpdateLetter = (updatedLetter) => {
    setLetters((prev) =>
      prev.map((letter) => (letter._id === updatedLetter._id ? updatedLetter : letter))
    );
  };

  const handleDeleteLetter = (deletedId) => {
    setLetters((prev) => prev.filter((letter) => letter._id !== deletedId));
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <p>Loading your saved shoutouts...</p>
      </div>
    );
  }

  return (
    <div className="saved-letters-view">
      <div className="feed-card" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>🔖 Saved Shoutouts</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Inspiring recognition notes and messages you bookmarked
        </p>
      </div>

      {letters.length === 0 ? (
        <div className="empty-feed">
          <h4>No Saved Shoutouts Yet</h4>
          <p>Click "Save" on any shoutout in the feed to bookmark it for later reference.</p>
        </div>
      ) : (
        <div className="feed-stream">
          {letters.map((letter) => (
            <PostItem
              key={letter._id}
              letter={letter}
              onUpdateLetter={handleUpdateLetter}
              onDeleteLetter={handleDeleteLetter}
              onRequireAuth={onRequireAuth}
              initialBookmarked={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
