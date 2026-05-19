import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['SCHOLARSHIP', 'EXAM', 'PLACEMENT', 'FACULTY', 'CLUB', 'ADMIN'];
const STAKES = [
  { value: 'LOW', label: 'Low', gain: '+5', loss: '-10', desc: 'Fairly confident' },
  { value: 'MEDIUM', label: 'Medium', gain: '+10', loss: '-17', desc: 'Very confident' },
  { value: 'HIGH', label: 'High', gain: '+15', loss: '-25', desc: 'Absolutely certain' },
];

export default function SubmitTip() {
  const [form, setForm] = useState({ title: '', body: '', category: 'SCHOLARSHIP', expiry_date: '', confidence_stake: 'MEDIUM', branch_scope: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/tips', { ...form, branch_scope: form.branch_scope ? form.branch_scope.split(',').map(s => s.trim()) : [] });
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="main page--narrow">
      <div className="form-card">
        <h2>Submit a Tip</h2>
        <p className="subtitle">Your credibility score is staked on this. Only share what you know firsthand.</p>
        {error && <p className="error-msg" style={{marginBottom: 16}}>{error}</p>}
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Title <span className="hint">(max 100 chars)</span></label>
            <input value={form.title} onChange={set('title')} maxLength={100} required placeholder="e.g. Submit scholarship 5 days early — portal crashes" />
          </div>

          <div className="field">
            <label>Full context</label>
            <textarea value={form.body} onChange={set('body')} maxLength={1000} required rows={5} placeholder="What happens if you miss it? How do you know this? What's the real deadline?" />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12}}>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Deadline / Expiry</label>
              <input type="date" value={form.expiry_date} onChange={set('expiry_date')} required />
            </div>
          </div>

          <div className="field">
            <label>Confidence Stake</label>
            <div className="stake-options">
              {STAKES.map(s => (
                <div key={s.value} className={`stake-option stake-option--${s.value.toLowerCase()} ${form.confidence_stake === s.value ? 'stake-option--active' : ''}`}
                  onClick={() => setForm({ ...form, confidence_stake: s.value })}>
                  <div className="stake-option__label">{s.label}</div>
                  <div className="stake-option__desc">{s.gain} / {s.loss}</div>
                  <div className="stake-option__desc" style={{marginTop: 2}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Branch Scope <span className="hint">(comma-separated, blank = all)</span></label>
            <input value={form.branch_scope} onChange={set('branch_scope')} placeholder="CSE, ECE, ME" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Tip →'}
          </button>
        </form>
      </div>
    </div>
  );
}
