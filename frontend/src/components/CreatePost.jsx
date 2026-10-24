import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const CATEGORIES = [
  'General',
  'Academics',
  'Hackathons & Tech',
  'Club & Cultural',
  'Peer Mentorship',
  'Campus Life'
];

const BADGES = [
  { label: 'No Honor Badge', value: 'None' },
  { label: '🏆 Problem Solver', value: 'Problem Solver' },
  { label: '🛡️ Lifesaver', value: 'Lifesaver' },
  { label: '🤝 Team Player', value: 'Team Player' },
  { label: '🌟 Inspirational', value: 'Inspirational' },
  { label: '🌱 Community Builder', value: 'Community Builder' }
];

export default function CreatePost({ onLetterCreated, onRequireAuth }) {
  const { user, isAuthenticated } = useAuth();
  const [recipientName, setRecipientName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [badge, setBadge] = useState('None');
  const [isAnonymous, setIsAnonymous] = useState(false);
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
      setError('Please provide both a recipient name and shoutout content.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/letters', {
        recipientName: recipientName.trim(),
        content: content.trim(),
        category,
        badge,
        isAnonymous
      });

      // Reset form
      setRecipientName('');
      setContent('');
      setCategory('General');
      setBadge('None');
      setIsAnonymous(false);

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
          Want to shout out a peer, thank a mentor, or post an open letter?
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
        <div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Create Campus Shoutout</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Recognize a classmate, teammate, or mentor publicly
          </span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="create-post-form">
        <input
          type="text"
          className="input-recipient"
          placeholder="To: (e.g. Sarah from Web Dev, Alex Morgan, Hostel 3 TAs)"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          maxLength={100}
          required
        />

        <div className="post-options-row">
          <div className="select-wrapper">
            <label className="field-label">Category</label>
            <select
              className="form-select-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <label className="field-label">Honor Badge</label>
            <select
              className="form-select-sm"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
            >
              {BADGES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          className="textarea-letter"
          placeholder={`What would you like to appreciate about them, ${user.name.split(' ')[0]}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={3000}
          required
        />

        <div className="create-post-checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <span>Post as Anonymous Student <small>(identity hidden on public feed)</small></span>
          </label>
        </div>

        <div className="create-post-footer">
          <span className="char-counter">
            {content.length}/3000 characters
          </span>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !recipientName.trim() || !content.trim()}
          >
            {loading ? 'Posting...' : 'Post Shoutout (+5 pts)'}
          </button>
        </div>
      </form>
    </div>
  );
}
