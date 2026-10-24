import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Navbar({
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenNotifications
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      const checkUnread = async () => {
        try {
          const res = await api.get('/notifications');
          if (isMounted) {
            setUnreadCount(res.data.unreadCount || 0);
          }
        } catch {
          // silently handle
        }
      };
      checkUnread();
      const interval = setInterval(checkUnread, 30000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <button
          onClick={() => onSelectTab('feed')}
          className="navbar-brand-btn"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <div className="navbar-brand">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            CampusEcho <span>• Shoutouts</span>
          </div>
        </button>

        {/* Center Nav Links */}
        <nav className="navbar-nav-links">
          <button
            className={`nav-link-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => onSelectTab('feed')}
          >
            Feed
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('leaderboard')}
          >
            Leaderboard
          </button>
          {isAuthenticated && (
            <button
              className={`nav-link-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => onSelectTab('saved')}
            >
              Saved
            </button>
          )}
        </nav>

        {/* User / Auth Section */}
        <div className="navbar-user-section">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <button
                onClick={onOpenNotifications}
                className="nav-icon-btn"
                title="Notifications"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span className="navbar-badge-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* User Badge with Karma Score */}
              <div className="user-badge" title={user.email}>
                <div className="avatar-circle">
                  {getInitials(user.name)}
                </div>
                <div className="nav-user-meta">
                  <span className="nav-user-name">{user.name.split(' ')[0]}</span>
                  <span className="nav-user-karma">⚡ {user.karmaScore || 0} pts</span>
                </div>
              </div>

              <button onClick={logout} className="btn-outline">
                Log Out
              </button>
            </>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary">
              Log In / Sign Up
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
