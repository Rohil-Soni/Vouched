import { useState, useEffect, useRef } from 'react';
import api from '../api';
import './SubmitTipModal.css';

/* ── CATEGORY OPTIONS ── */
const CATEGORIES = ['SCHOLARSHIP', 'EXAM', 'PLACEMENT', 'FACULTY', 'CLUB', 'ADMIN'];

/* ── CONFIDENCE STAKE OPTIONS ── */
const STAKES = [
  { value: 'LOW',    label: 'Low',    gain: '+5',  loss: '-10', desc: 'Fairly confident' },
  { value: 'MEDIUM', label: 'Medium', gain: '+10', loss: '-17', desc: 'Very confident' },
  { value: 'HIGH',   label: 'High',   gain: '+15', loss: '-25', desc: 'Absolutely certain' },
];

/* ── PROPS ──
 * isOpen     – boolean: show or hide the modal
 * onClose    – function: called when modal should close
 * onSuccess  – function: called after tip is successfully submitted
 * ───────────────────────────────── */
export default function SubmitTipModal({ isOpen, onClose, onSuccess }) {
  /* ── FORM STATE ── */
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'SCHOLARSHIP',
    expiry_date: '',
    confidence_stake: 'MEDIUM',
    branch_scope: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Shortcut: updates a single form field ── */
  const setField = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  /* ── REF for focusing the title input on mount ── */
  const titleRef = useRef(null);

  /* ── Auto-focus title when modal opens ── */
  useEffect(() => {
    if (isOpen) {
      // Small delay so the modal renders first, then focus
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /* ── Close on Escape key ── */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  /* ── Reset form when modal opens ── */
  useEffect(() => {
    if (isOpen) {
      setForm({ title: '', body: '', category: 'SCHOLARSHIP', expiry_date: '', confidence_stake: 'MEDIUM', branch_scope: '' });
      setError('');
    }
  }, [isOpen]);

  /* ── Close if user clicks on the overlay (but NOT inside the modal card) ── */
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) onClose();
  };

  /* ── SUBMIT HANDLER ──
   *  Called when user clicks "Submit Tip →"
   *  Sends POST /tips to the backend
   *  ───────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();   // prevents the page from refreshing
    setError('');
    setLoading(true);

    try {
      // Build the payload — convert comma-separated branches into an array
      const payload = {
        ...form,
        branch_scope: form.branch_scope
          ? form.branch_scope.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };

      await api.post('/tips', payload);
      onSuccess();    // tell the feed to refresh
      onClose();      // close the modal
    } catch (err) {
      // Show the backend error message (or a generic one)
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── If modal is closed, render nothing ── */
  if (!isOpen) return null;

  /* ── Character counter helper ── */
  const bodyLen = form.body.length;
  const charClass = bodyLen > 900 ? 'char-count--danger' : bodyLen > 750 ? 'char-count--warn' : '';

  /* ── RENDER THE MODAL ── */
  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card">
        {/* ═══ HEADER ═══ */}
        <div className="modal-header">
          <h2>New Tip</h2>
          <button className="modal-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>

        {/* ═══ FORM ═══ */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Error message */}
            {error && <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>}

            {/* ── Title ── */}
            <div className="field">
              <label>Title <span className="hint">(max 100 chars)</span></label>
              <input
                ref={titleRef}
                value={form.title}
                onChange={setField('title')}
                maxLength={100}
                required
                placeholder="e.g. Submit scholarship 5 days early — portal crashes"
              />
            </div>

            {/* ── Category + Expiry side by side ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={setField('category')}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Deadline / Expiry</label>
                <input type="date" value={form.expiry_date} onChange={setField('expiry_date')} required />
              </div>
            </div>

            {/* ── Body / Context ── */}
            <div className="field">
              <label>Full context</label>
              <textarea
                value={form.body}
                onChange={setField('body')}
                maxLength={1000}
                required
                rows={5}
                placeholder="What happens if you miss it? How do you know this? What's the real deadline?"
              />
              <div className={`char-count ${charClass}`}>
                {bodyLen}/1000
              </div>
            </div>

            {/* ── Confidence Stake ── */}
            <div className="field">
              <label>Confidence Stake</label>
              <div className="stake-options">
                {STAKES.map(s => (
                  <div
                    key={s.value}
                    className={`stake-option stake-option--${s.value.toLowerCase()} ${form.confidence_stake === s.value ? 'stake-option--active' : ''}`}
                    onClick={() => setForm({ ...form, confidence_stake: s.value })}
                  >
                    <div className="stake-option__label">{s.label}</div>
                    <div className="stake-option__desc">{s.gain} / {s.loss}</div>
                    <div className="stake-option__desc" style={{ marginTop: 2 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Branch Scope ── */}
            <div className="field">
              <label>Branch Scope <span className="hint">(comma-separated, blank = all)</span></label>
              <input
                value={form.branch_scope}
                onChange={setField('branch_scope')}
                placeholder="CSE, ECE, ME"
              />
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Tip →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
