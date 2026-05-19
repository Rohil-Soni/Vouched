import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function TipDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/tips/${id}`),
      api.get(`/tips/${id}/disputes`),
    ])
      .then(([tipRes, disputesRes]) => {
        setTip(tipRes.data);
        setDisputes(disputesRes.data);
      })
      .catch(() => setError('Failed to load tip'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="main"><div className="loading">Loading tip...</div></div>;
  if (error) return <div className="main"><p className="error-msg">{error}</p></div>;
  if (!tip) return <div className="main"><p className="error-msg">Tip not found</p></div>;

  const getCredibilityColor = (score) => {
    if (score >= 75) return '#22d3a0';
    if (score >= 50) return '#f5a623';
    return '#f25c7a';
  };

  const getCredibilityTier = (score) => {
    if (score >= 75) return 'TRUSTED';
    if (score >= 50) return 'AVERAGE';
    return 'NEW';
  };

  const daysLeft = Math.ceil((new Date(tip.expiry_date) - Date.now()) / 86400000);
  const credColor = getCredibilityColor(tip.author_credibility);
  const credTier = getCredibilityTier(tip.author_credibility);
  const CAT_COLOR = {
    SCHOLARSHIP: '#f5a623', EXAM: '#f25c7a', PLACEMENT: '#b06af7',
    FACULTY: '#4da6ff', CLUB: '#22d3a0', ADMIN: '#5a5a7a',
  };

  return (
    <div className="main page--narrow">
      <Link to="/feed" style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24, display: 'inline-block' }}>
        ← Back to Feed
      </Link>

      {/* Tip Content */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: `${CAT_COLOR[tip.category]}20`, color: CAT_COLOR[tip.category] }}>
            {tip.category}
          </span>
          {tip.branch_scope?.length > 0 && (
            <span className="tip-card__branch">{tip.branch_scope.join(', ')}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: daysLeft <= 3 ? 'var(--red)' : daysLeft <= 7 ? 'var(--yellow)' : 'var(--text2)' }}>
            {daysLeft <= 0 ? '⏱ Expired' : daysLeft <= 3 ? `⚠ ${daysLeft}d left` : `${daysLeft}d left`}
          </span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, lineHeight: 1.3 }}>{tip.title}</h1>

        {/* Author Credibility Section */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'var(--surface2)', border: `2px solid ${credColor}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: credColor }}>{tip.author_credibility}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{credTier}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{tip.author_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Year {tip.author_year || 'N/A'} • {tip.author_branch || 'N/A'}</div>
              {tip.cosigner_name && (
                <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>✓ Co-signed by {tip.cosigner_name}</div>
              )}
            </div>
            {tip.confidence_stake && (
              <div style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: tip.confidence_stake === 'HIGH' ? '#f25c7a15' : tip.confidence_stake === 'MEDIUM' ? '#f5a62315' : '#22d3a015',
                color: tip.confidence_stake === 'HIGH' ? 'var(--red)' : tip.confidence_stake === 'MEDIUM' ? 'var(--yellow)' : 'var(--green)',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {tip.confidence_stake} Stake
              </div>
            )}
          </div>
        </div>

        {/* Tip Body */}
        <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)', marginBottom: 32, padding: 20, background: 'var(--bg2)', borderRadius: 12 }}>
          {tip.body}
        </div>

        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32, padding: 20, background: 'var(--bg2)', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Expires</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(tip.expiry_date).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Posted</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(tip.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{tip.status}</div>
          </div>
        </div>

        {/* Action Buttons */}
        {user?.role === 'FRESHER' || user?.role !== 'SENIOR' ? (
          <Link
            to={`/dispute/${tip.id}`}
            className="btn btn-primary"
            style={{ marginBottom: 20 }}
          >
            Report an Issue with This Tip
          </Link>
        ) : (
          <button className="btn btn-secondary" style={{ marginBottom: 20 }} disabled>
            Seniors cannot dispute their own content
          </button>
        )}

        <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
          Found something wrong? Use the dispute form to report inaccuracies with evidence.
        </p>
      </div>

      {/* Disputes Section */}
      {disputes.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Dispute Activity ({disputes.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {disputes.map(dispute => (
              <div key={dispute.id} style={{
                background: 'var(--bg2)', padding: 12, borderRadius: 8, borderLeft: `3px solid ${dispute.status === 'UPHELD' ? 'var(--red)' : 'var(--green)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    Dispute #{dispute.id.slice(0, 8)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: dispute.status === 'UPHELD' ? '#f25c7a15' : '#22d3a015',
                    color: dispute.status === 'UPHELD' ? 'var(--red)' : 'var(--green)',
                    textTransform: 'uppercase'
                  }}>
                    {dispute.status}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                  {dispute.q1_what_wrong}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {disputes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">✓</div>
          <div className="empty-state__title">No disputes</div>
          <div className="empty-state__desc">This tip has no reported issues.</div>
        </div>
      )}
    </div>
  );
}
