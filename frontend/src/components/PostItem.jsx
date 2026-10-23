import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function PostItem({ letter, onUpdateLetter, onDeleteLetter, onRequireAuth }) {
  const { user, isAuthenticated } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [liking, setLiking] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  const isLikedByCurrentUser = () => {
    if (!isAuthenticated || !user || !letter.likes) return false;
    const userId = user._id || user.id;
    return letter.likes.some((id) => (typeof id === 'object' ? id._id || id : id) === userId);
  };

  const isAuthor = () => {
    if (!isAuthenticated || !user || !letter.author) return false;
    const authorId = letter.author._id || letter.author;
    const userId = user._id || user.id;
    return authorId === userId;
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (liking) return;

    setLiking(true);
    try {
      const res = await api.put(`/letters/${letter._id}/like`);
      onUpdateLetter(res.data);
    } catch (err) {
      console.error('Failed to like post:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!commentText.trim() || commenting) return;

    setCommenting(true);
    try {
      const res = await api.post(`/letters/${letter._id}/comment`, {
        text: commentText.trim()
      });
      onUpdateLetter(res.data);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this shoutout?')) return;
    try {
      await api.delete(`/letters/${letter._id}`);
      onDeleteLetter(letter._id);
    } catch (err) {
      console.error('Failed to delete letter:', err);
    }
  };

  const authorName = letter.author?.name || 'Anonymous';
  const hasLiked = isLikedByCurrentUser();
  const likesCount = letter.likes?.length || 0;
  const commentsCount = letter.comments?.length || 0;

  return (
    <article className="feed-card post-card">
      {/* Header */}
      <header className="post-header">
        <div className="post-author-info">
          <div className="avatar-circle">
            {getInitials(authorName)}
          </div>
          <div className="author-details">
            <span className="author-name">{authorName}</span>
            <span className="post-time">{formatDate(letter.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="recipient-tag-badge">
            To: {letter.recipientName}
          </div>
          {isAuthor() && (
            <button
              onClick={handleDelete}
              className="btn-icon-danger"
              title="Delete post"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Main Text Content */}
      <div className="post-content">
        {letter.content}
      </div>

      {/* Metrics Bar */}
      <div className="post-metrics">
        <div className="metrics-left">
          <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
        </div>
        <div className="metrics-right">
          <button
            onClick={() => setShowComments(!showComments)}
            className="btn-text"
            style={{ color: 'var(--text-secondary)', padding: 0 }}
          >
            {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
          </button>
        </div>
      </div>

      {/* Action Bar (Like / Comment) */}
      <div className="post-actions">
        <button
          onClick={handleLike}
          className={`action-btn ${hasLiked ? 'active-like' : ''}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={hasLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {hasLiked ? 'Liked' : 'Like'}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="action-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Comment
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="comments-section">
          {letter.comments && letter.comments.length > 0 && (
            <div className="comments-list">
              {letter.comments.map((comment, index) => {
                const commenterName = comment.user?.name || 'User';
                return (
                  <div key={comment._id || index} className="comment-bubble">
                    <div className="avatar-circle sm">
                      {getInitials(commenterName)}
                    </div>
                    <div className="comment-content">
                      <div className="comment-user">{commenterName}</div>
                      <div className="comment-text">{comment.text}</div>
                      <div className="comment-time">{formatDate(comment.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Comment Input Form */}
          <form onSubmit={handleCommentSubmit} className="add-comment-box">
            <input
              type="text"
              className="add-comment-input"
              placeholder={
                isAuthenticated
                  ? 'Write a comment...'
                  : 'Log in to add a comment...'
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={commenting}
            />
            <button
              type="submit"
              className="btn-post-comment"
              disabled={commenting || !commentText.trim()}
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
