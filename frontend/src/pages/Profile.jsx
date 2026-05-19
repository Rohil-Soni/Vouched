import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const DELTA_LABELS = {
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

  return (
    <div className="page page--narrow">
      <div className="profile__header">
        <div>
          <h2>{user.name}</h2>
          <p className="profile__meta">{user.role} · {user.branch} · Year {user.year_of_study}</p>
          <p className="profile__email">{user.email}</p>
        </div>
        <div className="profile__score">
          <span className="score__number">{user.credibility_score}</span>
          <span className="score__label">Credibility</span>
        </div>
      </div>

      <div className="profile__bar">
        <div className="profile__bar-fill" style={{ width: `${user.credibility_score}%` }} />
      </div>

      <h3>Credibility History</h3>
      {loading && <p className="loading">Loading...</p>}
      {!loading && history.length === 0 && <p className="empty">No credibility events yet.</p>}
      <ul className="cred-history">
        {history.map((ev, i) => (
          <li key={i} className={`cred-event ${ev.delta > 0 ? 'cred-event--pos' : 'cred-event--neg'}`}>
            <span>{DELTA_LABELS[ev.reason] || ev.reason}</span>
            <span className="cred-event__delta">{ev.delta > 0 ? `+${ev.delta}` : ev.delta}</span>
            <span className="cred-event__date">{new Date(ev.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>

      <button className="btn-logout" onClick={logout}>Logout</button>
    </div>
  );
}
