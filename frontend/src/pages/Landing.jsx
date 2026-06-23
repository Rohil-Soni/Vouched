import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoHorizontal from '../assets/Logo with name horizontal.png';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 32px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <img src={logoHorizontal} alt="Vouched" className="navbar__logo-img" />
        {user ? (
          <Link to="/feed" className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
            Go to Feed
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text2)', fontWeight: 600, fontSize: 14, padding: '8px 16px', borderRadius: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => {e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.06)'}}
              onMouseLeave={e => {e.target.style.color = 'var(--text2)'; e.target.style.background = 'transparent'}}
            >
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>Sign Up</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '120px 28px',
        textAlign: 'center',
        maxWidth: 800,
        margin: '0 auto',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <h1 style={{
          fontSize: 52, fontWeight: 900, marginBottom: 24, lineHeight: 1.15,
          position: 'relative', letterSpacing: '-1px'
        }}>
          College intelligence{' '}
          <span style={{
            background: 'linear-gradient(135deg, #fb923c 0%, #f43f5e 50%, #eab308 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            worth trusting
          </span>
        </h1>

        <p style={{
          fontSize: 18, color: 'var(--text2)', marginBottom: 48, lineHeight: 1.7,
          maxWidth: 640, margin: '0 auto 48px', position: 'relative'
        }}>
          Seniors share real, actionable advice about courses, placements, events, professors, and online resources. Every tip carries a personal credibility score — so you know exactly who to trust.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative', flexWrap: 'wrap' }}>
          {!user && (
            <>
              <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '14px 36px', fontSize: 16 }}>
                Create Your Account
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ width: 'auto', padding: '14px 36px', fontSize: 16 }}>
                Already Registered?
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: '100px 28px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 60, textAlign: 'center' }}>
            How it works
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{
                width: 64, height: 64,
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 146, 60, 0.1))',
                border: '2px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, color: 'var(--orange)',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)'
              }}>
                1
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Seniors share what they know</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>
                Tips about events worth attending, resources worth reading, professors worth approaching, and deadlines worth knowing. Each tip is timestamped and carries the author's credibility score.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{
                width: 64, height: 64,
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(249, 115, 22, 0.1))',
                border: '2px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, color: 'var(--coral)',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(244, 63, 94, 0.15)'
              }}>
                2
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>The community vouches for accuracy</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>
                Every tip can be co-signed or disputed. Accurate contributions increase your credibility score. Misleading information lowers it. The system rewards honesty.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{
                width: 64, height: 64,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.1))',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, color: 'var(--green-light)',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
              }}>
                3
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Freshers make informed decisions</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>
                No more guessing which event is worth your time or which resource deserves your attention. See everything ranked by urgency and the credibility of the person who shared it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Works - Features */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '100px 28px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 60, textAlign: 'center' }}>
          Every contribution is backed by reputation
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            {
              title: 'Credibility score',
              desc: 'Every user has a visible score based on the accuracy of their contributions. Higher score equals higher trust. The score is earned, not given.'
            },
            {
              title: 'Dispute system',
              desc: 'If a tip is wrong, anyone can file a structured dispute. Moderators with 75+ credibility review evidence and vote. False reports are penalized too.'
            },
            {
              title: 'Co-signing',
              desc: 'Seniors can co-sign each other\'s tips, adding a second layer of verification. A co-signed tip carries more weight.'
            },
            {
              title: 'Confidence staking',
              desc: 'When submitting a tip, seniors stake their reputation on Low, Medium, or High confidence. Higher stakes mean higher rewards for accuracy and bigger penalties for mistakes.'
            },
            {
              title: 'Smart filters',
              desc: 'Filter tips by category, urgency, or branch. See what matters most to you, when it matters.'
            },
            {
              title: 'Permanent archive',
              desc: 'Verified tips get archived permanently. A living record of how your college actually works, built by students who\'ve been through it.'
            }
          ].map(feature => (
            <div key={feature.title} style={{
              padding: 28,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.3s var(--ease-out)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 28px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(244, 63, 94, 0.05) 50%, rgba(234, 179, 8, 0.05) 100%)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
            Ready to know what they know?
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
            Join seniors who are already sharing what they wish they knew as freshers. Your college experience should be guided by people who have actually been through it.
          </p>
          {!user && (
            <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '14px 44px', fontSize: 16 }}>
              Sign Up Now
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 28px',
        textAlign: 'center',
        color: 'var(--text3)',
        fontSize: 12
      }}>
        <p>Vouched — College intelligence worth trusting</p>
        <p style={{ marginTop: 8 }}>Built by students, for students. &copy; 2026.</p>
      </footer>
    </div>
  );
}
