import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/feed" className="navbar__brand">Vouched</NavLink>
      <div className="navbar__links">
        <NavLink to="/feed" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>Feed</NavLink>
        <NavLink to="/archive" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>Archive</NavLink>
        {user?.role === 'SENIOR' && (
          <NavLink to="/submit" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>+ Tip</NavLink>
        )}
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
          {user?.name?.split(' ')[0]} · {user?.credibility_score}
        </NavLink>
      </div>
    </nav>
  );
}
