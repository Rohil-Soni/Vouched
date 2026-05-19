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
    <div className="auth-container">
      <h2>Enter your OTP</h2>
      <p>Sent to <strong>{email}</strong></p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleVerify}>
        <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" required maxLength={6} />
        <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Login'}</button>
      </form>
    </div>
  );

  return (
    <div className="auth-container">
      <h2>Welcome back</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleRequestOTP}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="College email" type="email" required />
        <button type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Continue'}</button>
      </form>
      <p>New here? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}
