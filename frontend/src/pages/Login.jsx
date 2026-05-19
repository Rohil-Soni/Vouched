import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Login() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/login', { email });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login/verify', { email, otp });
      const { data: user } = await api.get('/users/me', { headers: { Authorization: `Bearer ${data.token}` } });
      login(data.token, user);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  if (step === 'otp') return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-card__logo">Vouched</div>
        <h2>Enter your OTP</h2>
        <p className="subtitle">6-digit code sent to your college email.</p>
        <div className="otp-display">Sent to <strong>{email}</strong></div>
        {error && <p className="error-msg" style={{marginTop: 12}}>{error}</p>}
        <form onSubmit={handleVerify} style={{marginTop: 16}}>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" required maxLength={6} style={{textAlign:'center', fontSize: 22, letterSpacing: 8, fontWeight: 700}} />
          <button type="submit" className="btn btn-primary" style={{marginTop: 14}} disabled={loading}>
            {loading ? 'Verifying...' : 'Login →'}
          </button>
        </form>
        <p className="footer-link" style={{marginTop: 16}}>
          <a href="#" onClick={() => setStep('email')}>← Use different email</a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-card__logo">Vouched</div>
        <h2>Welcome back</h2>
        <p className="subtitle">Login with your college email — no password needed.</p>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleRequestOTP}>
          <div className="field">
            <label>College Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.ac.in" type="email" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{marginTop: 4}} disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP →'}
          </button>
        </form>
        <p className="footer-link">New here? <Link to="/signup">Create account</Link></p>
      </div>
    </div>
  );
}
