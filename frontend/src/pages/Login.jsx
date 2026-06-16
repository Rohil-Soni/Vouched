import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMAIL_STORAGE_KEY = 'vouched_emails';

function getSavedEmails() {
  try {
    const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addSavedEmail(email) {
  const list = getSavedEmails().filter(e => e !== email);
  list.unshift(email);
  localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(list.slice(0, 5)));
}

export default function Login() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedEmails, setSavedEmails] = useState(getSavedEmails());
  const { login } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSavedEmails(getSavedEmails());
  }, []);

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
      addSavedEmail(email);
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
            {loading ? 'Verifying...' : 'Login \u2192'}
          </button>
        </form>
        <p className="footer-link" style={{marginTop: 16}}>
          <a href="#" onClick={() => setStep('email')}>{"\u2190"} Use different email</a>
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
            <div ref={wrapperRef} style={{ position: 'relative' }}>
              <input
                value={email}
                onChange={e => { setEmail(e.target.value); setShowSuggestions(true); }}
                onFocus={() => savedEmails.length > 0 && setShowSuggestions(true)}
                placeholder="you@college.ac.in"
                type="email"
                required
                autoComplete="off"
              />
              {showSuggestions && savedEmails.length > 0 && (
                <ul style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: '#fff', border: '1px solid #ddd', borderRadius: 8,
                  marginTop: 4, padding: '4px 0', listStyle: 'none',
                  zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {savedEmails.map((saved) => (
                    <li
                      key={saved}
                      onClick={() => { setEmail(saved); setShowSuggestions(false); }}
                      style={{
                        padding: '8px 14px', cursor: 'pointer', fontSize: 14,
                        color: email === saved ? '#7c3aed' : '#374151',
                        background: email === saved ? '#f5f3ff' : 'transparent'
                      }}
                      onMouseEnter={e => e.target.style.background = '#f3f4f6'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                      {saved}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{marginTop: 4}} disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP \u2192'}
          </button>
        </form>
        <p className="footer-link">New here? <Link to="/signup">Create account</Link></p>
      </div>
    </div>
  );
}
