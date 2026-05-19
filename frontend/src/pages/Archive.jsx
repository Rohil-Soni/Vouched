import { useState, useEffect } from 'react';
import api from '../api';

const CATEGORIES = ['ALL', 'Faculty Patterns', 'Department Norms', 'Club & Society Realities', 'Admin & Bureaucracy', 'Placement & Internship Truths'];

export default function Archive() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [vouching, setVouching] = useState(null);

  useEffect(() => {
    const params = filter !== 'ALL' ? `?category=${encodeURIComponent(filter)}` : '';
    api.get(`/archive${params}`)
      .then(({ data }) => setEntries(data))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleVouch = async (id) => {
    setVouching(id);
    try {
      await api.post(`/archive/${id}/vouch`);
      setEntries(entries.map(e => e.id === id ? { ...e, vouch_count: e.vouch_count + 1 } : e));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not vouch');
    } finally { setVouching(null); }
  };

  return (
    <div className="page">
      <h2>Unwritten Rules Archive</h2>
      <p className="page__subtitle">Anonymous. Moderated. Permanent institutional truth.</p>

      <div className="feed__filters">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`filter-btn ${filter === cat ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(cat)}>{cat}</button>
        ))}
      </div>

      {loading && <p className="loading">Loading archive...</p>}
      {!loading && entries.length === 0 && <p className="empty">No entries yet for this category.</p>}

      <div className="archive__list">
        {entries.map(entry => (
          <div key={entry.id} className="archive-card">
            <div className="archive-card__meta">
              <span className="archive-card__category">{entry.category}</span>
              {entry.branch && <span className="archive-card__branch">{entry.branch}</span>}
            </div>
            <p className="archive-card__body">{entry.body}</p>
            <div className="archive-card__footer">
              <span>Vouched by {entry.vouch_count} seniors</span>
              <button
                className="btn-vouch"
                onClick={() => handleVouch(entry.id)}
                disabled={vouching === entry.id}
              >
                {vouching === entry.id ? '...' : 'Still accurate ✓'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
