import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Signup() {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ email: '', name: '', branch: '', year_of_study: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/signup', { ...form, year_of_study: Number(form.year_of_study) });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: form.email, otp });
      localStorage.setItem('token', data.token);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  if (step === 'otp') return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-card__logo">Vouched</div>
        <h2>Check your email</h2>
        <p className="subtitle">We sent a 6-digit code to your college email.</p>
        <div className="otp-display">Sent to <strong>{form.email}</strong></div>
        {error && <p className="error-msg" style={{marginTop: 12}}>{error}</p>}
        <form onSubmit={handleVerify} style={{marginTop: 16}}>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" required maxLength={6} style={{textAlign:'center', fontSize: 22, letterSpacing: 8, fontWeight: 700}} />
          <button type="submit" className="btn btn-primary" style={{marginTop: 14}} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Continue →'}
          </button>
        </form>
        <p className="footer-link" style={{marginTop: 16}}>
          <a href="#" onClick={() => setStep('form')}>← Back</a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-card__logo">Vouched</div>
        <h2>Create your account</h2>
        <p className="subtitle">Use your college email to get verified access.</p>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSignup}>
          <div className="field">
            <label>College Email</label>
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@college.ac.in" type="email" required />
          </div>
          <div className="field">
            <label>Full Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" required />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12}}>
            <div className="field">
              <label>Branch</label>
              <input value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} placeholder="e.g. CSE" required />
            </div>
            <div className="field">
              <label>Year</label>
              <input value={form.year_of_study} onChange={e => setForm({...form, year_of_study: e.target.value})} placeholder="1–5" type="number" min={1} max={5} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{marginTop: 4}} disabled={loading}>
            {loading ? 'Sending OTP...' : 'Continue →'}
          </button>
        </form>
        <p className="footer-link">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
