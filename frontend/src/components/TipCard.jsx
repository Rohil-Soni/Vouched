import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  SCHOLARSHIP: '#f59e0b', EXAM: '#ef4444', PLACEMENT: '#8b5cf6',
  FACULTY: '#3b82f6', CLUB: '#10b981', ADMIN: '#6b7280',
};

const daysLeft = (expiry) => Math.ceil((new Date(expiry) - Date.now()) / 86400000);

export default function TipCard({ tip }) {
  const navigate = useNavigate();
  const days = daysLeft(tip.expiry_date);
  const urgent = days <= 3;

  return (
    <div className={`tip-card ${urgent ? 'tip-card--urgent' : ''}`} onClick={() => navigate(`/tips/${tip.id}`)}>
      <div className="tip-card__header">
        <span className="tip-card__category" style={{ background: CATEGORY_COLORS[tip.category] }}>
          {tip.category}
        </span>
        {tip.branch_scope?.length > 0 && (
          <span className="tip-card__branch">{tip.branch_scope.join(', ')}</span>
        )}
        <span className={`tip-card__days ${urgent ? 'tip-card__days--urgent' : ''}`}>
          {days <= 0 ? 'Expired' : `${days}d left`}
        </span>
      </div>
      <h3 className="tip-card__title">{tip.title}</h3>
      <p className="tip-card__body">{tip.body}</p>
      <div className="tip-card__footer">
        <span>By {tip.author_name}</span>
        <span className="tip-card__cred">⬡ {tip.author_credibility}</span>
        <span className="tip-card__cosigned">Co-signed ✓</span>
      </div>
    </div>
  );
}
