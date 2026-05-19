import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function ModeratorQueue() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('OPEN');
  const [votingOn, setVotingOn] = useState(null);
  const [submittingVote, setSubmittingVote] = useState(false);

  useEffect(() => {
    if (!user || user.credibility_score < 75) {
      setError('You need 75+ credibility to moderate disputes');
      setLoading(false);
      return;
    }

    api.get(`/moderator/disputes?status=${filter}`)
      .then(({ data }) => setDisputes(data))
      .catch(() => setError('Failed to load disputes'))
      .finally(() => setLoading(false));
  }, [filter, user]);

  const handleVote = async (disputeId, vote) => {
    setSubmittingVote(true);
    try {
      await api.post(`/moderator/disputes/${disputeId}/vote`, { vote });
      setDisputes(prev => prev.filter(d => d.id !== disputeId));
      setVotingOn(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Vote failed');
    } finally {
      setSubmittingVote(false);
    }
  };

  if (!user || user.credibility_score < 75) {
    return (
      <div className="main page--narrow">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2>Moderator Access Required</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
            You need a credibility score of 75+ to view the moderator queue.
          </p>
          {user && (
            <p style={{ color: 'var(--text2)' }}>
              Your current score: <strong>{user.credibility_score}</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="main page--narrow">
      <div className="page-header">
        <h2>Moderator Queue</h2>
        <p className="page__subtitle">Review disputes. Vote on accuracy. Shape credibility.</p>
      </div>

      {/* Filters */}
      <div className="filters">
        {['OPEN', 'UPHELD', 'REJECTED'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Loading disputes...</div>}
      {error && <p className="error-msg">{error}</p>}

      {!loading && disputes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">✓</div>
          <div className="empty-state__title">All caught up!</div>
          <div className="empty-state__desc">
            {filter === 'OPEN' ? 'No open disputes waiting for review.' : `No ${filter.toLowerCase()} disputes.`}
          </div>
        </div>
      )}

      {!loading && disputes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {disputes.map(dispute => (
            <div
              key={dispute.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 24,
                cursor: votingOn === dispute.id ? 'default' : 'pointer',
              }}
            >
              {votingOn === dispute.id ? (
                // Voting Interface
                <>
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                      Tip: {dispute.tip_title}
                    </h3>

                    <div style={{ background: 'var(--bg2)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>What Was Wrong?</div>
                      <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{dispute.q1_what_wrong}</p>
                    </div>

                    <div style={{ background: 'var(--bg2)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>What Actually Happened?</div>
                      <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{dispute.q3_actual_outcome}</p>
                    </div>

                    {dispute.q5_evidence && (
                      <div style={{ background: 'var(--bg2)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Evidence</div>
                        <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{dispute.q5_evidence}</p>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Reported By</div>
                        <div style={{ fontSize: 13 }}>{dispute.reporter_name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Original Author</div>
                        <div style={{ fontSize: 13 }}>{dispute.author_name}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => handleVote(dispute.id, 'UPHOLD')}
                      disabled={submittingVote}
                      className="btn btn-primary"
                      style={{ flex: 1, background: 'var(--red)' }}
                    >
                      {submittingVote ? 'Voting...' : '✓ Dispute is Valid'}
                    </button>
                    <button
                      onClick={() => handleVote(dispute.id, 'REJECT')}
                      disabled={submittingVote}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      {submittingVote ? 'Voting...' : '✗ Dispute Invalid'}
                    </button>
                  </div>

                  <button
                    onClick={() => setVotingOn(null)}
                    className="btn btn-secondary"
                    style={{ marginTop: 12, width: '100%' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                // Dispute Summary
                <>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                        {dispute.tip_title}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, marginBottom: 8 }}>
                        {dispute.q1_what_wrong.slice(0, 100)}...
                      </p>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        Reported by <strong>{dispute.reporter_name}</strong> • {new Date(dispute.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
                      background: '#f5a62315', color: 'var(--yellow)', textTransform: 'uppercase'
                    }}>
                      Pending
                    </span>
                  </div>

                  <button
                    onClick={() => setVotingOn(dispute.id)}
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '8px 16px' }}
                  >
                    Review & Vote
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
