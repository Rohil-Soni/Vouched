import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['SCHOLARSHIP', 'EXAM', 'PLACEMENT', 'FACULTY', 'CLUB', 'ADMIN'];
const STAKES = ['LOW', 'MEDIUM', 'HIGH'];

export default function SubmitTip() {
  const [form, setForm] = useState({
    title: '', body: '', category: 'SCHOLARSHIP',
    expiry_date: '', confidence_stake: 'MEDIUM', branch_scope: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        branch_scope: form.branch_scope ? form.branch_scope.split(',').map(s => s.trim()) : [],
      };
      await api.post('/tips', payload);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="page page--narrow">
      <h2>Submit a Tip</h2>
      <p className="page__subtitle">Your credibility score is staked on this. Share only what you know.</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label>Title <span className="hint">(max 100 chars)</span></label>
        <input value={form.title} onChange={set('title')} maxLength={100} required placeholder="e.g. Submit scholarship 5 days early" />

        <label>Full context</label>
        <textarea value={form.body} onChange={set('body')} maxLength={1000} required rows={5}
          placeholder="What happens if you miss it? How do you know this?" />

        <label>Category</label>
        <select value={form.category} onChange={set('category')}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <label>Deadline / Expiry date</label>
        <input type="date" value={form.expiry_date} onChange={set('expiry_date')} required />

        <label>Confidence stake</label>
        <select value={form.confidence_stake} onChange={set('confidence_stake')}>
          {STAKES.map(s => <option key={s}>{s}</option>)}
        </select>
        <p className="hint">
          LOW: +5 / -10 &nbsp;|&nbsp; MEDIUM: +10 / -17 &nbsp;|&nbsp; HIGH: +15 / -25 credibility
        </p>

        <label>Branch scope <span className="hint">(comma-separated, leave blank for all)</span></label>
        <input value={form.branch_scope} onChange={set('branch_scope')} placeholder="CSE, ECE" />

        <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Tip'}</button>
      </form>
    </div>
  );
}
