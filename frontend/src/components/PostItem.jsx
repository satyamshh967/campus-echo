import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ReportModal from './ReportModal';

const REACTION_CONFIG = {
  heart: { emoji: '❤️', label: 'Love', color: '#ed4956' },
  applause: { emoji: '👏', label: 'Clap', color: '#1877f2' },
  insightful: { emoji: '💡', label: 'Insightful', color: '#f59e0b' },
  inspiring: { emoji: '🚀', label: 'Inspiring', color: '#8b5cf6' }
};

export default function PostItem({
  letter,
  onUpdateLetter,
  onDeleteLetter,
  onRequireAuth,
  initialBookmarked = false
}) {
  const { user, isAuthenticated } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
    const diffInSeconds = Math.floor((new Date() - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  // Find user's active reaction
  const getCurrentUserReaction = () => {
    if (!isAuthenticated || !user || !letter.reactions) return null;
    const userId = user._id || user.id;
    const found = letter.reactions.find(
      (r) => (typeof r.user === 'object' ? r.user?._id || r.user : r.user) === userId
    );
    return found ? found.type : null;
  };

  const isAuthor = () => {
    if (!isAuthenticated || !user || !letter.author) return false;
    const authorId = letter.author._id || letter.author;
    const userId = user._id || user.id;
    return authorId && authorId === userId;
  };

  const handleReaction = async (type = 'heart') => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (liking) return;

    setLiking(true);
    setShowReactionsMenu(false);

    try {
      const res = await api.put(`/letters/${letter._id}/reaction`, { type });
      onUpdateLetter(res.data);
    } catch (err) {
      console.error('Failed to react:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    try {
      const res = await api.put(`/letters/${letter._id}/bookmark`);
      setBookmarked(res.data.isBookmarked);
    } catch (err) {
      console.error('Failed to bookmark:', err);
    }
  };

  const handleShare = () => {
    const shareText = `CampusEcho Shoutout to ${letter.recipientName}: "${letter.content.slice(0, 80)}..."`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const userReaction = getCurrentUserReaction();
  const reactionsList = letter.reactions || [];
  const reactionsCount = reactionsList.length || letter.likes?.length || 0;
  const commentsCount = letter.comments?.length || 0;

  // Aggregate unique emoji reactions present on this post
  const uniqueReactionTypes = Array.from(
    new Set(reactionsList.map((r) => r.type))
  );

  const isAnonymous = letter.isAnonymous && !isAuthor();
  const authorName = isAnonymous ? 'Anonymous Student' : letter.author?.name || 'Campus Member';
  const authorDept = !isAnonymous ? letter.author?.department || 'Campus' : 'Verified Student';

  return (
    <article className="feed-card post-card">
      {/* Header */}
      <header className="post-header">
        <div className="post-author-info">
          <div className={`avatar-circle ${isAnonymous ? 'avatar-anon' : ''}`}>
            {isAnonymous ? '🕵️' : getInitials(authorName)}
          </div>
          <div className="author-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span className="author-name">{authorName}</span>
              {isAnonymous && <span className="anon-tag-pill">Anonymous</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="post-time">{authorDept} • {formatDate(letter.createdAt)}</span>
            </div>
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}

          <button
            onClick={() => {
              if (!isAuthenticated) onRequireAuth();
              else setReportModalOpen(true);
            }}
            className="btn-icon-flag"
            title="Report this post to moderation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Meta Pills (Category & Badge) */}
      <div className="post-meta-tags">
        {letter.category && letter.category !== 'General' && (
          <span className="tag-pill category-pill">
            📁 {letter.category}
          </span>
        )}
        {letter.badge && letter.badge !== 'None' && (
          <span className="tag-pill badge-pill">
            🎖️ {letter.badge}
          </span>
        )}
      </div>

      {/* Main Text Content */}
      <div className="post-content">
        {letter.content}
      </div>

      {/* Metrics Bar */}
      <div className="post-metrics">
        <div className="metrics-left">
          {uniqueReactionTypes.length > 0 ? (
            <span style={{ marginRight: '4px' }}>
              {uniqueReactionTypes.map((t) => REACTION_CONFIG[t]?.emoji || '❤️').join('')}
            </span>
          ) : (
            <span>❤️</span>
          )}
          <span>{reactionsCount} {reactionsCount === 1 ? 'reaction' : 'reactions'}</span>
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

      {/* Action Bar (Reactions Menu, Comment, Bookmark, Share) */}
      <div className="post-actions" style={{ position: 'relative' }}>
        {/* Floating Multi-Reactions Popover */}
        {showReactionsMenu && (
          <div
            className="reactions-popover"
            onMouseLeave={() => setShowReactionsMenu(false)}
          >
            {Object.entries(REACTION_CONFIG).map(([type, config]) => (
              <button
                key={type}
                className="reaction-option-btn"
                title={config.label}
                onClick={() => handleReaction(type)}
              >
                <span>{config.emoji}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => handleReaction(userReaction || 'heart')}
          onMouseEnter={() => setShowReactionsMenu(true)}
          className={`action-btn ${userReaction ? 'active-like' : ''}`}
          style={{ color: userReaction ? REACTION_CONFIG[userReaction]?.color : undefined }}
        >
          {userReaction ? (
            <>
              <span>{REACTION_CONFIG[userReaction]?.emoji}</span>
              <span className="action-btn-label">{REACTION_CONFIG[userReaction]?.label}</span>
            </>
          ) : (
            <>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span className="action-btn-label">React</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="action-btn"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span className="action-btn-label">Comment</span>
        </button>

        <button
          onClick={handleBookmarkToggle}
          className={`action-btn ${bookmarked ? 'active-bookmark' : ''}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={bookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className="action-btn-label">{bookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button
          onClick={handleShare}
          className={`action-btn ${copied ? 'active-share' : ''}`}
          title="Share shoutout"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span className="action-btn-label">{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="comments-section">
          {letter.comments && letter.comments.length > 0 && (
            <div className="comments-list">
              {letter.comments.map((comment, index) => {
                const commenterName = comment.user?.name || 'Campus Peer';
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

          {/* Add Comment Input */}
          <form onSubmit={handleCommentSubmit} className="add-comment-box">
            <input
              type="text"
              className="add-comment-input"
              placeholder={
                isAuthenticated
                  ? 'Add a supportive comment...'
                  : 'Log in to comment...'
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

      {/* Trust & Safety Moderation Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        letterId={letter._id}
        onReportSuccess={(data) => {
          if (data.status === 'quarantined') {
            onDeleteLetter(letter._id);
          }
        }}
      />
    </article>
  );
}
