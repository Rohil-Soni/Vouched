import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
          {user?.name?.split(' ')[0]} <span style={{opacity:0.5}}>·</span> <span style={{color:'var(--accent)'}}>{user?.credibility_score}</span>
        </NavLink>
      </div>
    </nav>
  );
}
