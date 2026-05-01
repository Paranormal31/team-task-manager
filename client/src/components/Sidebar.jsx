import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, User, Activity, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src="/logo/logo_24x24.png" alt="TaskFlow logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>TaskFlow</h1>
      </div>

      <nav style={{ flex: 1 }}>
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/projects" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}
        >
          <FolderKanban size={20} />
          <span>Projects</span>
        </NavLink>
        <NavLink 
          to="/efficiency" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}
        >
          <Activity size={20} />
          <span>Efficiency</span>
        </NavLink>
        <NavLink 
          to="/team" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}
        >
          <Users size={20} />
          <span>Team</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', background: 'var(--bg-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} />
            </div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', color: 'var(--danger)', textAlign: 'left' }}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>

      <style>{`
        .nav-link:hover { background: var(--bg-input); }
        .nav-link.active { background: var(--primary); color: white; }
      `}</style>
    </aside>
  );
};

export default Sidebar;
