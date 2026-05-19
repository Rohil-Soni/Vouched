import { useState, useEffect } from 'react';
import api from '../api';
import TipCard from '../components/TipCard';

const CATEGORIES = ['ALL', 'SCHOLARSHIP', 'EXAM', 'PLACEMENT', 'FACULTY', 'CLUB', 'ADMIN'];

export default function Feed() {
  const [tips, setTips] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/tips')
      .then(({ data }) => setTips(data))
      .catch(() => setError('Failed to load feed'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? tips : tips.filter(t => t.category === filter);

  return (
    <div className="page">
      <div className="feed__filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <p className="loading">Loading feed...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && filtered.length === 0 && <p className="empty">No tips yet for this filter.</p>}

      <div className="feed__list">
        {filtered.map(tip => <TipCard key={tip.id} tip={tip} />)}
      </div>
    </div>
  );
}
