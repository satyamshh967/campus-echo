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
    <>
      {/* Top Navbar */}
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
              CampusEcho <span className="brand-subtitle">• Shoutouts</span>
            </div>
          </button>

          {/* Desktop Center Nav Links */}
          <nav className="navbar-nav-links desktop-nav">
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
                {/* Desktop Notification Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="nav-icon-btn desktop-bell"
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
                  <div className="nav-user-meta desktop-user-meta">
                    <span className="nav-user-name">{user.name.split(' ')[0]}</span>
                    <span className="nav-user-karma">⚡ {user.karmaScore || 0} pts</span>
                  </div>
                </div>

                <button onClick={logout} className="btn-outline btn-logout-compact">
                  Log Out
                </button>
              </>
            ) : (
              <button onClick={onOpenAuth} className="btn-primary btn-login-compact">
                Log In / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Instagram / Facebook Mobile Style) */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => onSelectTab('feed')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Feed</span>
        </button>

        <button
          className={`mobile-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('leaderboard')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
          <span>Leaderboard</span>
        </button>

        {isAuthenticated && (
          <button
            className={`mobile-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => onSelectTab('saved')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Saved</span>
          </button>
        )}

        {isAuthenticated ? (
          <button
            className="mobile-tab-btn"
            onClick={onOpenNotifications}
            style={{ position: 'relative' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span className="navbar-badge-dot mobile-badge-dot">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span>Alerts</span>
          </button>
        ) : (
          <button className="mobile-tab-btn" onClick={onOpenAuth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Log In</span>
          </button>
        )}
      </nav>
    </>
  );
}
