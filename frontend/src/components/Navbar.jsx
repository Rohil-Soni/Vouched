import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getCredibilityTier = (score) => {
  if (score >= 75) return 'Trusted';
  if (score >= 50) return 'Established';
  return 'Building';
};

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/feed" className="navbar__brand">Vouched</NavLink>
      <div className="navbar__links">
        <NavLink to="/feed" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Feed</NavLink>
        <NavLink to="/archive" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Archive</NavLink>
        {user?.role === 'SENIOR' && (
          <NavLink to="/submit" className="nav-link nav-link--submit">+ Tip</NavLink>
        )}
        {user?.credibility_score >= 75 && (
          <NavLink to="/moderator/queue" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Moderate</NavLink>
        )}
        <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
          {user?.name?.split(' ')[0]}
        </NavLink>
        <span className="navbar__cred">
          <span className="navbar__cred-dot" />
          {user?.credibility_score ?? 0}
        </span>
      </div>
    </nav>
  );
}
