import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth }) {
  const { user, isAuthenticated, logout } = useAuth();

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
        <a href="/" className="navbar-brand">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          OpenLetter <span>• Shoutouts</span>
        </a>

        <div className="navbar-user-section">
          {isAuthenticated ? (
            <>
              <div className="user-badge" title={user.email}>
                <div className="avatar-circle">
                  {getInitials(user.name)}
                </div>
                <span>{user.name}</span>
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
