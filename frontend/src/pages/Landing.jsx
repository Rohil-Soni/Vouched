import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #a090ff, #7c6af7, #4da6ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Vouched
        </div>
        {user ? (
          <Link to="/feed" className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
            Go to Feed
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>Sign Up</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '120px 28px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 20, lineHeight: 1.2 }}>
          Intelligence From Those <span style={{ background: 'linear-gradient(135deg, #a090ff, #7c6af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Who've Been There</span>
        </h1>
        
        <p style={{ fontSize: 18, color: 'var(--text2)', marginBottom: 40, lineHeight: 1.6, maxWidth: 700, margin: '0 auto 40px' }}>
          Some students arrive at college already knowing the game. First-generation students don't get that conversation. <strong>Vouched exists to give it to them.</strong>
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 60 }}>
          {!user && (
            <>
              <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '14px 32px', fontSize: 16 }}>
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ width: 'auto', padding: '14px 32px', fontSize: 16 }}>
                I Have an Account
              </Link>
            </>
          )}
        </div>

        {/* Trust Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 80, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>5000+</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Active Seniors</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>25</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Colleges</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>10k+</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Tips Shared</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: 'var(--surface)', padding: '80px 28px', marginBottom: 80 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 60, textAlign: 'center' }}>How Vouched Works</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {/* Step 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: 'var(--accent-glow)', border: '2px solid var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--accent)', margin: '0 auto 20px' }}>
                1
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Seniors Share Tips</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
                Seniors submit structured tips about scholarships, placements, faculty, and club insights. Every tip carries their credibility.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: 'var(--accent-glow)', border: '2px solid var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--accent)', margin: '0 auto 20px' }}>
                2
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Freshers Get Nudges</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
                Set your profile once. Get reminders 3 weeks, 1 week, and 3 days before important deadlines hit.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, background: 'var(--accent-glow)', border: '2px solid var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--accent)', margin: '0 auto 20px' }}>
                3
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Credibility Matters</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
                Accurate tips build trust. Wrong tips lose credibility. The system is designed so reputation is everything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 28px', marginBottom: 80 }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 60, textAlign: 'center' }}>Why Vouched Works</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Urgency-Based Ranking</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
              Tips are ranked by both urgency and contributor credibility. You see what matters most, from people you can trust.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>College-Verified</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
              Signup requires your college email. Freshers can read. Seniors can write. Everyone's verified.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚙️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Friction-Based Disputes</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
              Reporting a tip isn't a button tap. It's structured. Evidence matters. Bad-faith reports get penalized.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔔</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Smart Nudges</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
              Not just reminders. Full context. You get pinged 3 weeks, 1 week, and 3 days before windows close.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Trust Circles</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
              Private groups. Invite only. For sensitive tips. Can be anonymously escalated if group vouches it.
            </p>
          </div>

          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📖</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Archive</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
              Permanent, living record of how your college works. Moderated. Anonymous. Gets indexed forever.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)', padding: '80px 28px', textAlign: 'center', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Ready to Know What They Know?</h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
            Join seniors from your college who are already sharing what they know. Your first-generation advantage starts here.
          </p>
          {!user && (
            <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '14px 40px', fontSize: 16 }}>
              Sign Up Now →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 28px', textAlign: 'center', color: 'var(--text3)', fontSize: 12, borderTop: '1px solid var(--border)' }}>
        <p>Vouched — Intelligence from those who've been there</p>
        <p style={{ marginTop: 12 }}>© 2026. All rights reserved.</p>
      </footer>
    </div>
  );
}
