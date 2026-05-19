import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Signup() {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
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
    <div className="auth-container">
      <h2>Verify your college email</h2>
      <p>OTP sent to <strong>{form.email}</strong></p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleVerify}>
        <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" required maxLength={6} />
        <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
      </form>
    </div>
  );

  return (
    <div className="auth-container">
      <h2>Join Vouched</h2>
      <p>Use your college email to get started.</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSignup}>
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="College email" type="email" required />
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
        <input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} placeholder="Branch (e.g. CSE)" required />
        <input value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })} placeholder="Year of study (1-5)" type="number" min={1} max={5} required />
        <button type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Continue'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
