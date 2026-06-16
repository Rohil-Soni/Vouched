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
    <div className="main page--narrow">
      <button onClick={() => navigate(-1)} style={{ color: 'var(--text2)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-block', marginBottom: 24, textDecoration: 'underline' }}>
        Back to tip
      </button>

      <div className="form-card">
        <h2>File a Dispute</h2>
        <p className="subtitle">
          Disputing a tip affects your credibility too if rejected. Answer honestly — the system relies on good-faith reports.
        </p>

        {error && <p className="error-msg" style={{ marginBottom: 20 }}>{error}</p>}

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>1. What specifically was inaccurate?</label>
            <textarea value={form.q1_what_wrong} onChange={set('q1_what_wrong')} required rows={3} placeholder="Describe exactly what part of the tip is wrong and why." />
          </div>

          <div className="field">
            <label>2. Did you personally act on this tip?</label>
            <div className="radio-group">
              <label><input type="radio" name="acted" value="yes" onChange={() => setForm({ ...form, q2_acted_on_tip: 'yes' })} /> Yes, I relied on this tip</label>
              <label><input type="radio" name="acted" value="no" onChange={() => setForm({ ...form, q2_acted_on_tip: 'no' })} /> No, I read it after the fact</label>
            </div>
          </div>

          <div className="field">
            <label>3. What was the actual outcome you experienced?</label>
            <textarea value={form.q3_actual_outcome} onChange={set('q3_actual_outcome')} required rows={3} placeholder="What happened when you followed (or investigated) the tip? Be specific." />
          </div>

          <div className="field">
            <label>4. When did this happen?</label>
            <input type="date" value={form.q4_when_happened} onChange={set('q4_when_happened')} required />
          </div>

          <div className="field">
            <label>5. Supporting evidence <span className="hint">(optional)</span></label>
            <textarea value={form.q5_evidence} onChange={set('q5_evidence')} rows={2} placeholder="Screenshot description, email forwarding details, links to official sources, etc." />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting Dispute...' : 'Submit Dispute'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
          False disputes negatively impact your credibility score. Only file if you're certain.
        </p>
      </div>
    </div>
  );
}
