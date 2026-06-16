import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const LABELS = {
  tip_confirmed: 'Tip confirmed accurate',
  dispute_upheld: 'Dispute upheld against your tip',
  dispute_rejected: 'Your dispute was rejected',
  cosign_confirmed: 'Co-signed tip confirmed',
  cosign_disputed: 'Co-signed tip disputed',
};

const getCredibilityTier = (score) => {
  if (score >= 85) return { label: 'Highly Trusted', color: '#22d3a0', gradient: 'linear-gradient(135deg, #10b981, #34d399)' };
  if (score >= 75) return { label: 'Trusted', color: '#34d399', gradient: 'linear-gradient(135deg, #10b981, #22d3a0)' };
  if (score >= 50) return { label: 'Established', color: '#fbbf24', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' };
  if (score >= 25) return { label: 'Learning', color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' };
  return { label: 'Getting Started', color: '#f87171', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' };
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/credibility')
      .then(({ data }) => setHistory(data))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const tier = getCredibilityTier(user.credibility_score);

  const recentPos = history.filter(h => h.delta > 0).length;
  const recentNeg = history.filter(h => h.delta < 0).length;

  return (
    <div className="main page--narrow">
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p className="profile-meta">
            {user.role} &middot; {user.branch} &middot; Year {user.year_of_study}
          </p>
          <p className="profile-meta" style={{ marginTop: 2, fontSize: 13, color: 'var(--text3)' }}>
            {user.email}
          </p>
        </div>
        <div className="profile-score">
          <div className="score-number">{user.credibility_score}</div>
          <div className="score-label">
            <span style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${tier.color}`,
              color: tier.color,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {tier.label}
            </span>
          </div>
        </div>
      </div>

      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${Math.min(user.credibility_score, 100)}%` }} />
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 32
      }}>
        <div style={{
          padding: 20,
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--green-light)' }}>{recentPos}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginTop: 4 }}>Positive Contributions</div>
        </div>
        <div style={{
          padding: 20,
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--red-light)' }}>{recentNeg}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginTop: 4 }}>Negative Events</div>
        </div>
      </div>

      <p className="section-title">Credibility History</p>

      {loading && <div className="loading">Loading...</div>}
      {!loading && history.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__title">No events yet</div>
          <div className="empty-state__desc">Submit tips or co-sign to start building your credibility score.</div>
        </div>
      )}

      <div className="cred-list">
        {history.map((ev, i) => (
          <div key={i} className={`cred-item ${ev.delta > 0 ? 'cred-item--pos' : 'cred-item--neg'}`}>
            <span className="cred-item__label">{LABELS[ev.reason] || ev.reason}</span>
            <span className="cred-item__delta">{ev.delta > 0 ? `+${ev.delta}` : ev.delta}</span>
            <span className="cred-item__date">{new Date(ev.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-danger" style={{ marginTop: 36 }} onClick={logout}>
        Logout
      </button>
    </div>
  );
}
