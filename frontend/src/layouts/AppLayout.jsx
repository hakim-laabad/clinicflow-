import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon, { Logo } from '../components/Icon.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/patients', label: 'Patients', icon: 'users' },
  { to: '/appointments', label: 'Appointments', icon: 'calendar' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={36} />
          <div className="brand-text">
            <span className="brand-title">ClinicFlow</span>
            <span className="brand-badge">Clinical Suite</span>
          </div>
        </div>

        <div className="nav-section-title">Menu</div>
        <nav>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon name={n.icon} size={18} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="spacer" />

          <div className="profile">
            <div className="avatar">{user.email[0].toUpperCase()}</div>
            <div className="who">
              <span className="user-email">{user.email}</span>
              <span className={`role-pill ${user.role}`}>{user.role.toUpperCase()}</span>
            </div>
            <button
              className="btn sm signout-btn"
              onClick={() => { logout(); navigate('/login'); }}
              title="Sign out"
            >
              <Icon name="logout" size={15} /> Sign out
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
