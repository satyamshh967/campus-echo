import React, { useEffect, useState } from 'react';
import api from '../api/client';
import CreatePost from './CreatePost';
import PostItem from './PostItem';

export default function Feed({ onRequireAuth }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all letters on mount
  const fetchLetters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/letters');
      setLetters(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch letters:', err);
      setError('Unable to load shoutout board. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  // Prepend newly created post
  const handleLetterCreated = (newLetter) => {
    setLetters((prev) => [newLetter, ...prev]);
  };

  // Update modified post (like, comment)
  const handleUpdateLetter = (updatedLetter) => {
    setLetters((prev) =>
      prev.map((letter) => (letter._id === updatedLetter._id ? updatedLetter : letter))
    );
  };

  // Remove deleted post
  const handleDeleteLetter = (deletedId) => {
    setLetters((prev) => prev.filter((letter) => letter._id !== deletedId));
  };

  return (
    <main className="main-feed-container">
      {/* Create Shoutout / Letter Section */}
      <CreatePost
        onLetterCreated={handleLetterCreated}
        onRequireAuth={onRequireAuth}
      />

      {/* Error Notice */}
      {error && (
        <div className="error-banner" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className="spinner-container">
          <p>Loading shoutouts...</p>
        </div>
      ) : letters.length === 0 ? (
        /* Empty Feed State */
        <div className="empty-feed">
          <h4>No Shoutouts Yet</h4>
          <p>Be the first one to appreciate someone or share an open letter!</p>
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
