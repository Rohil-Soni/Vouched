import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function FileDispute() {
  const { tipId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    q1_what_wrong: '',
    q2_acted_on_tip: null,
    q3_actual_outcome: '',
    q4_when_happened: '',
    q5_evidence: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.q2_acted_on_tip === null) return setError('Please answer whether you acted on this tip');
    setError(''); setLoading(true);
    try {
      await api.post('/disputes', { tip_id: tipId, ...form, q2_acted_on_tip: form.q2_acted_on_tip === 'yes' });
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to file dispute');
    } finally { setLoading(false); }
  };

  return (
    <div className="page page--narrow">
      <h2>File a Dispute</h2>
      <p className="page__subtitle">
        Disputing a tip affects your credibility too if rejected. Answer honestly.
      </p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label>1. What specifically was inaccurate?</label>
        <textarea value={form.q1_what_wrong} onChange={set('q1_what_wrong')} required rows={3} />

        <label>2. Did you personally act on this tip?</label>
        <div className="radio-group">
          <label><input type="radio" name="acted" value="yes" onChange={() => setForm({ ...form, q2_acted_on_tip: 'yes' })} /> Yes</label>
          <label><input type="radio" name="acted" value="no" onChange={() => setForm({ ...form, q2_acted_on_tip: 'no' })} /> No</label>
        </div>

        <label>3. What was the actual outcome you experienced?</label>
        <textarea value={form.q3_actual_outcome} onChange={set('q3_actual_outcome')} required rows={3} />

        <label>4. When did this happen?</label>
        <input type="date" value={form.q4_when_happened} onChange={set('q4_when_happened')} required />

        <label>5. Supporting evidence <span className="hint">(optional)</span></label>
        <textarea value={form.q5_evidence} onChange={set('q5_evidence')} rows={2} placeholder="Screenshot description, links, etc." />

        <button type="submit" disabled={loading}>{loading ? 'Filing...' : 'Submit Dispute'}</button>
      </form>
    </div>
  );
}
