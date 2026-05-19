import { useNavigate } from 'react-router-dom';

const CAT_CLASS = {
  SCHOLARSHIP: 'badge-scholarship', EXAM: 'badge-exam', PLACEMENT: 'badge-placement',
  FACULTY: 'badge-faculty', CLUB: 'badge-club', ADMIN: 'badge-admin',
};
const CAT_COLOR = {
  SCHOLARSHIP: '#f5a623', EXAM: '#f25c7a', PLACEMENT: '#b06af7',
  FACULTY: '#4da6ff', CLUB: '#22d3a0', ADMIN: '#5a5a7a',
};

const daysLeft = (expiry) => Math.ceil((new Date(expiry) - Date.now()) / 86400000);

// Credibility tier colors based on score 0-100
const getCredibilityColor = (score) => {
  if (score >= 75) return '#22d3a0'; // Green - Highly trusted
  if (score >= 50) return '#f5a623'; // Orange - Average
  return '#f25c7a'; // Red - New/Low credibility
};

const getCredibilityTier = (score) => {
  if (score >= 75) return 'TRUSTED';
  if (score >= 50) return 'AVERAGE';
  return 'NEW';
};

export default function TipCard({ tip }) {
  const navigate = useNavigate();
  const days = daysLeft(tip.expiry_date);
  const urgent = days <= 3;
  const soon = days <= 7 && !urgent;
  const credColor = getCredibilityColor(tip.author_credibility);
  const credTier = getCredibilityTier(tip.author_credibility);

  return (
    <div
      className={`tip-card ${urgent ? 'tip-card--urgent' : ''} ${soon ? 'tip-card--soon' : ''}`}
      style={{ '--cat-color': CAT_COLOR[tip.category], position: 'relative' }}
    >
      {/* Header with metadata */}
      <div className="tip-card__header">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <span className={`badge ${CAT_CLASS[tip.category]}`}>{tip.category}</span>
          {tip.branch_scope?.length > 0 && (
            <span className="tip-card__branch">{tip.branch_scope.join(', ')}</span>
          )}
        </div>
        <span className={`tip-card__days ${urgent ? 'tip-card__days--urgent' : soon ? 'tip-card__days--soon' : ''}`}>
          {days <= 0 ? '⏱ Expired' : urgent ? `⚠ ${days}d left` : `${days}d left`}
        </span>
      </div>

      {/* Title and Body */}
      <h3 className="tip-card__title">{tip.title}</h3>
      <p className="tip-card__body">{tip.body}</p>

      {/* Credibility & Trust Section */}
      <div className="tip-card__credibility">
        <div className="credibility-badge" style={{ '--cred-color': credColor }}>
          <div className="credibility-badge__score">{tip.author_credibility}</div>
          <div className="credibility-badge__tier">{credTier}</div>
        </div>
        <div className="credibility-info">
          <div className="credibility-info__author">{tip.author_name}</div>
          <div className="credibility-info__year">Year {tip.author_year || 'N/A'}</div>
        </div>
        {tip.cosigner_name && (
          <div className="cosign-badge">
            <span>✓ Co-signed by {tip.cosigner_name}</span>
          </div>
        )}
      </div>

      {/* Confidence Stake Display */}
      {tip.confidence_stake && (
        <div className="tip-card__stake">
          <span className={`stake-badge stake-${tip.confidence_stake.toLowerCase()}`}>
            {tip.confidence_stake} Confidence
          </span>
        </div>
      )}

      {/* Footer with action hint */}
      <div className="tip-card__footer">
        <span className="tip-card__interaction">Click to view details or dispute</span>
      </div>

      {/* Clickable overlay */}
      <button
        className="tip-card__overlay"
        onClick={() => navigate(`/tips/${tip.id}`)}
        aria-label={`View details for: ${tip.title}`}
        type="button"
      />
    </div>
  );
}
