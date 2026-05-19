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

  return (
    <div className="main page--narrow">
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p className="profile-meta">{user.role} · {user.branch} · Year {user.year_of_study}</p>
          <p className="profile-meta" style={{marginTop: 2}}>{user.email}</p>
        </div>
        <div className="profile-score">
          <div className="score-number">{user.credibility_score}</div>
          <div className="score-label">Credibility</div>
        </div>
      </div>

      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${user.credibility_score}%` }} />
      </div>

      <p className="section-title">Credibility History</p>

      {loading && <div className="loading">Loading...</div>}
      {!loading && history.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">📊</div>
          <div className="empty-state__title">No events yet</div>
          <div className="empty-state__desc">Submit or co-sign tips to start building your credibility.</div>
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

      <button className="btn btn-danger" style={{marginTop: 32}} onClick={logout}>Logout</button>
    </div>
  );
}
