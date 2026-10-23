import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function CreatePost({ onLetterCreated, onRequireAuth }) {
  const { user, isAuthenticated } = useAuth();
  const [recipientName, setRecipientName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (!recipientName.trim() || !content.trim()) {
      setError('Please provide both a recipient name and letter content.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/letters', {
        recipientName: recipientName.trim(),
        content: content.trim()
      });
      // Reset form
      setRecipientName('');
      setContent('');
      if (onLetterCreated) {
        onLetterCreated(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish shoutout');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-prompt-banner">
        <div className="login-prompt-text">
          Want to shout out a peer or write an open letter?
        </div>
        <button onClick={onRequireAuth} className="btn-primary">
          Log In to Post
        </button>
      </div>
    );
  }

  return (
    <div className="feed-card create-post-card">
      <div className="create-post-header">
        <div className="avatar-circle">
          {getInitials(user.name)}
        </div>
        <h3>Post an Open Letter / Shoutout</h3>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="create-post-form">
        <input
          type="text"
          className="input-recipient"
          placeholder="To: (e.g. Sarah Connor, Design Team, Mentor)"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          maxLength={100}
          required
        />

        <textarea
          className="textarea-letter"
          placeholder={`What would you like to say, ${user.name.split(' ')[0]}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={3000}
          required
        />

        <div className="create-post-footer">
          <span className="char-counter">
            {content.length}/3000 characters
          </span>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !recipientName.trim() || !content.trim()}
          >
            {loading ? 'Posting...' : 'Post Shoutout'}
          </button>
        </div>
      </form>
    </div>
  );
}
