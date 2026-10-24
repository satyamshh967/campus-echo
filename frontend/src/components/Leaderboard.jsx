import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Leaderboard() {
  const [data, setData] = useState({ topUsers: [], badgeStats: [], categoryStats: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/letters/leaderboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankBadge = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <p>Calculating Campus Impact rankings...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-view">
      {/* Top Recognized Members */}
      <div className="feed-card">
        <div className="section-title-row">
          <span className="section-icon">🏆</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Campus Echo Karma Leaderboard</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Top contributors recognized by peers across campus
            </p>
          </div>
        </div>

        <div className="leaderboard-list">
          {data.topUsers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '12px 0' }}>
              No campus members ranked yet. Start sharing shoutouts to earn karma!
            </p>
          ) : (
            data.topUsers.map((user, idx) => (
              <div key={user._id || idx} className="leaderboard-row">
                <div className="rank-indicator">{getRankBadge(idx)}</div>
                <div className="avatar-circle sm">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="leaderboard-user-details">
                  <span className="leaderboard-user-name">{user.name}</span>
                  <span className="leaderboard-user-dept">{user.department || 'Campus'}</span>
                </div>
                <div className="karma-score-badge">
                  ⚡ {user.karmaScore || 0} pts
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Campus Badges & Category Highlights */}
      <div className="feed-card" style={{ marginTop: '16px' }}>
        <div className="section-title-row">
          <span className="section-icon">🎖️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Most Awarded Honors Badges</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Qualities celebrated the most by peers this semester
            </p>
          </div>
        </div>

        <div className="badge-stats-grid">
          {data.badgeStats.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No honor badges awarded yet. Attach a badge when writing a shoutout!
            </p>
          ) : (
            data.badgeStats.map((item) => (
              <div key={item._id} className="badge-stat-chip">
                <span className="badge-name">{item._id}</span>
                <span className="badge-count">{item.count} awarded</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
