import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import TipCard from '../components/TipCard';

const CATEGORIES = ['ALL', 'SCHOLARSHIP', 'EXAM', 'PLACEMENT', 'FACULTY', 'CLUB', 'ADMIN'];

export default function Feed({ tipRefreshKey }) {
  const { user } = useAuth();
  const [tips, setTips] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // ── Fetch tips from the backend ──
  // Re-fetches whenever tipRefreshKey changes (e.g. after new tip submission)
  useEffect(() => {
    api.get('/tips')
      .then(({ data }) => {
        setTips(data);
        // If this is a refresh (not initial load), show a toast
        if (tipRefreshKey > 0) {
          setToast('✓ Tip submitted! Awaiting a co-signer to go live.');
        }
      })
      .catch(() => setError('Failed to load feed'))
      .finally(() => setLoading(false));
  }, [tipRefreshKey]);

  // ── Auto-dismiss toast after 4 seconds ──
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = filter === 'ALL' ? tips : tips.filter(t => t.category === filter);
  const trustedCount = tips.filter(t => (t.author_credibility || 0) >= 75).length;

  return (
    <div className="main">
      {/* ── Toast notification ── */}
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header" style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
        <div>
          <h2>Intelligence Feed</h2>
          <p className="page__subtitle">
            {tips.length > 0
              ? `Showing ${filtered.length} tips ranked by urgency and contributor credibility`
              : 'Ranked by urgency and contributor credibility'}
          </p>
        </div>
        {user?.role === 'SENIOR' && (
          <Link to="/submit" className="btn btn-primary" style={{width:'auto', padding:'10px 20px', whiteSpace:'nowrap'}}>+ Submit Tip</Link>
        )}
      </div>

      {/* Trust summary - only show if there are tips */}
      {tips.length > 0 && !loading && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap'
        }}>
          <div style={{
            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            fontSize: 13, fontWeight: 600, color: 'var(--green-light)'
          }}>
            {trustedCount} tips from trusted contributors (75+)
          </div>
          <div style={{
            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(249, 115, 22, 0.06)',
            border: '1px solid rgba(249, 115, 22, 0.15)',
            fontSize: 13, fontWeight: 600, color: 'var(--accent-light)'
          }}>
            {tips.length} total tips shared
          </div>
        </div>
      )}

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
          <div className="empty-state__title">No tips yet</div>
          <div className="empty-state__desc">
            {user?.role === 'SENIOR'
              ? 'Be the first to share intelligence with your college. Your credibility starts with your first post.'
              : 'Check back soon. Seniors in your college are adding tips.'}
          </div>
        </div>
      )}

      <div className="feed__list">
        {filtered.map(tip => <TipCard key={tip.id} tip={tip} />)}
      </div>
    </div>
  );
}
