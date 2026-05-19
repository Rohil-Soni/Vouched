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

export default function TipCard({ tip }) {
  const navigate = useNavigate();
  const days = daysLeft(tip.expiry_date);
  const urgent = days <= 3;
  const soon = days <= 7 && !urgent;

  return (
    <div
      className={`tip-card ${urgent ? 'tip-card--urgent' : ''}`}
      style={{ '--cat-color': CAT_COLOR[tip.category] }}
      onClick={() => navigate(`/dispute/${tip.id}`)}
    >
      <div className="tip-card__header">
        <span className={`badge ${CAT_CLASS[tip.category]}`}>{tip.category}</span>
        {tip.branch_scope?.length > 0 && (
          <span className="tip-card__branch">{tip.branch_scope.join(', ')}</span>
        )}
        <span className={`tip-card__days ${urgent ? 'tip-card__days--urgent' : soon ? 'tip-card__days--soon' : ''}`}>
          {days <= 0 ? 'Expired' : urgent ? `⚠ ${days}d left` : `${days}d left`}
        </span>
      </div>
      <h3 className="tip-card__title">{tip.title}</h3>
      <p className="tip-card__body">{tip.body}</p>
      <div className="tip-card__footer">
        <span className="tip-card__author">{tip.author_name}</span>
        <span className="tip-card__cred">⬡ {tip.author_credibility}</span>
        <span className="tip-card__cosigned">✓ Co-signed</span>
      </div>
    </div>
  );
}
