import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="auth-card notification-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Notifications</h3>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="unread-badge-pill">
                {notifications.filter((n) => !n.isRead).length} new
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {notifications.length > 0 && (
              <button onClick={handleMarkAllRead} className="btn-text" style={{ fontSize: '0.8rem' }}>
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="btn-icon-danger" style={{ padding: '2px 6px' }}>
              ✕
            </button>
          </div>
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="spinner-container" style={{ padding: '24px 0' }}>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-feed" style={{ padding: '24px 12px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No notifications yet.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Activity on your shoutouts and mentions will appear here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(n._id)}
              >
                <div className="avatar-circle sm">
                  {n.sender?.name ? n.sender.name.slice(0, 2).toUpperCase() : '📣'}
                </div>
                <div className="notification-content">
                  <p className="notification-message">{n.message}</p>
                  <span className="notification-time">{formatDate(n.createdAt)}</span>
                </div>
                {!n.isRead && <span className="blue-unread-dot"></span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
