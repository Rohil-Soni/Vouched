import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import TipCard from '../components/TipCard';

const CATEGORIES = ['ALL', 'SCHOLARSHIP', 'EXAM', 'PLACEMENT', 'FACULTY', 'CLUB', 'ADMIN'];

export default function Feed() {
  const { user } = useAuth();
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
    <div className="main">
      <div className="page-header" style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
        <div>
          <h2>Intelligence Feed</h2>
          <p className="page__subtitle">Ranked by urgency × contributor credibility</p>
        </div>
        {user?.role === 'SENIOR' && (
          <Link to="/submit" className="btn btn-primary" style={{width:'auto', padding:'10px 20px'}}>+ Submit Tip</Link>
        )}
      </div>

      <div className="filters">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`filter-btn ${filter === cat ? 'filter-btn--active' : ''}`} onClick={() => setFilter(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Loading feed...</div>}
      {error && <p className="error-msg">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">📭</div>
          <div className="empty-state__title">No tips yet</div>
          <div className="empty-state__desc">
            {user?.role === 'SENIOR' ? 'Be the first to share intelligence with your college.' : 'Check back soon — seniors are adding tips.'}
          </div>
        </div>
      )}

      <div className="feed__list">
        {filtered.map(tip => <TipCard key={tip.id} tip={tip} />)}
      </div>
    </div>
  );
}
