import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CATEGORIES = ['SCHOLARSHIP', 'EXAM', 'PLACEMENT', 'FACULTY', 'CLUB', 'ADMIN', 'OTHER'];

export default function ArchiveSubmit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Content, 3: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    category: CATEGORIES[0],
    branch: '',
    body: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.body.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.body.trim().length < 50) {
      setError('Entry must be at least 50 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/archive', {
        category: form.category,
        branch: form.branch || null,
        body: form.body,
      });
      navigate('/archive', { state: { successMessage: 'Entry submitted for review. Thanks for contributing!' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main page--narrow">
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => navigate('/archive')} style={{ color: 'var(--text2)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          ← Back to Archive
        </button>
      </div>

      <div className="form-card">
        <h2>Contribute to the Archive</h2>
        <p className="subtitle">
          Share unwritten rules about how your college actually works. Entries are moderated before they go live.
        </p>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: s === step ? 'var(--accent)' : s < step ? 'var(--green)' : 'var(--surface)',
              border: `2px solid ${s === step ? 'var(--accent)' : s < step ? 'var(--green)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: s <= step ? '#fff' : 'var(--text2)'
            }}>
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>

        {error && <p className="error-msg" style={{ marginBottom: 20 }}>{error}</p>}

        <form onSubmit={handleSubmit} className="form">
          {step === 1 && (
            <>
              <div className="field">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="hint">What area of college life does this cover?</div>
              </div>

              <div className="field">
                <label>Branch (Optional)</label>
                <input
                  type="text"
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  placeholder="e.g. CSE, ECE"
                />
                <div className="hint">If this only applies to your branch</div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-primary"
              >
                Next: Write Entry →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="field">
                <label>Entry Content *</label>
                <textarea
                  name="body"
                  value={form.body}
                  onChange={handleChange}
                  placeholder="Write the unwritten rule. Be specific. Include actionable details. Keep it systemic, not personal. At least 50 characters."
                />
                <div className="hint">
                  {form.body.length} / 5000 characters
                  {form.body.length < 50 && <span style={{ color: 'var(--red)' }}> (minimum 50)</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={form.body.trim().length < 50}
                  className="btn btn-primary"
                >
                  Review Entry →
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>Category</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{form.category}</div>

                {form.branch && (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>Branch</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{form.branch}</div>
                  </>
                )}

                <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>Content</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{form.body}</p>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
                📋 <strong>Before submitting:</strong> Make sure this is systemic (not about a person), accurate, and helpful. Moderation happens within 24h. Personal attacks won't be approved.
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-secondary"
                >
                  ← Edit
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Submitting...' : 'Submit for Moderation →'}
                </button>
              </div>
            </>
          )}
        </form>

        <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
          All submissions are anonymous and reviewed before publication.
        </p>
      </div>
    </div>
  );
}
