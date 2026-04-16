import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Video, Users } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const getNavItemStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      padding: '0.75rem 1rem',
      background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
      borderRadius: 'var(--radius-sm)',
      color: isActive ? 'var(--primary)' : 'var(--text-main)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: isActive ? 600 : 400,
      textDecoration: 'none',
      marginBottom: '0.5rem',
      transition: 'all 0.2s',
    };
  };

  return (
    <div className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
        <Video color="var(--primary)" size={32} />
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Pulse</h2>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link to="/" style={getNavItemStyle('/')} className="nav-item">
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        {user?.role === 'Admin' && (
          <Link to="/team" style={getNavItemStyle('/team')} className="nav-item">
            <Users size={20} /> Team Members
          </Link>
        )}
      </div>

      <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--surface-border)' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.role}</div>
        </div>
        <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={logout}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
