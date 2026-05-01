import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Bell, Grid, UserPlus, Download, 
  RefreshCw, AlertCircle, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TeamDirectory = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showActionMenuId, setShowActionMenuId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive

  // New Member Form fields
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'MEMBER',
    status: 'Active Now',
    workload: 45
  });

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setTeam(res.data);
    } catch (err) {
      console.error('Failed to fetch team members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newMember);
      setShowInviteModal(false);
      setNewMember({
        name: '',
        email: '',
        role: 'MEMBER',
        status: 'Active Now',
        workload: 45
      });
      fetchTeam();
    } catch (err) {
      console.error('Failed to invite member', err);
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setShowActionMenuId(null);
      fetchTeam();
    } catch (err) {
      console.error('Failed to delete member', err);
    }
  };

  const handleToggleActive = async (member) => {
    const nextStatus = member.status === 'Active Now' ? 'Inactive' : 'Active Now';
    try {
      await api.put(`/users/${member._id}`, { status: nextStatus });
      setShowActionMenuId(null);
      fetchTeam();
    } catch (err) {
      console.error('Failed to update member status', err);
    }
  };

  // Export List functionality
  const handleExportList = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name,Email,Role,Status,Workload"].join(",") + "\n"
      + team.map(m => `"${m.name}","${m.email}","${m.role}","${m.status}","${m.workload}%"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "team_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering team members
  const filteredTeam = team.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase());

    const isActive = m.status === 'Active Now';
    const isInactive = m.status === 'Inactive' || m.status === 'Away';

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && isInactive);

    return matchesSearch && matchesStatus;
  });

  // Calculate stats from real data
  const totalMembers = team.length;
  const activeNow = team.filter(m => m.status === 'Active Now').length;
  const inMeeting = team.filter(m => m.status === 'In Meeting').length;
  const inactive = team.filter(m => m.status === 'Inactive' || m.status === 'Away').length;

  // Members added in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newThisMonth = team.filter(m => m.createdAt && new Date(m.createdAt) >= thirtyDaysAgo).length;

  // Utilization = % of team that is Active Now or In Meeting (i.e. working)
  const utilizationPct = totalMembers > 0 ? Math.round(((activeNow + inMeeting) / totalMembers) * 100) : 0;

  // Overloaded members (workload >= 80) — they "need attention" like expiring invites
  const overloadedCount = team.filter(m => (m.workload || 0) >= 80).length;

  // Pending = away members (they haven't accepted / aren't active)
  const pendingInvites = inactive;

  // Render Status Icon & Dot color
  const getStatusDotAndColor = (status) => {
    switch (status) {
      case 'Active Now':
        return { dot: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: '#047857' };
      case 'Away':
      case 'Inactive':
        return { dot: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', text: '#475569' };
      case 'In Meeting':
        return { dot: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: '#b45309' };
      default:
        return { dot: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: '#047857' };
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Search and Top Navbar Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        
        {/* Top Search Input */}
        <div style={{ position: 'relative', width: '420px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search team members..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '0.75rem 1rem 0.75rem 2.75rem', 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              fontSize: '0.875rem', 
              color: '#1e293b',
              width: '100%',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }} 
          />
        </div>

        {/* Profile & Header Extra Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Bell size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          <Grid size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          <div style={{ borderLeft: '1px solid #e2e8f0', height: '24px' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1e293b' }}>{user?.name || 'Dr. Aris Thorne'}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Administrator</p>
            </div>
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="User profile" 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0d9488' }} 
              />
            ) : (
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=40&h=40" 
                alt="Profile fallback" 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '0.25rem' }}>Team Directory</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Manage your clinical researchers and laboratory staff.</p>
        </div>

        {/* Buttons right aligned */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleExportList}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem 1.25rem', 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: '#334155', 
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <Download size={18} />
            <span>Export List</span>
          </button>
          
          <button 
            onClick={() => setShowInviteModal(true)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem 1.25rem', 
              background: '#0d9488', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(13, 148, 136, 0.15)'
            }}
          >
            <UserPlus size={18} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* TOTAL MEMBERS CARD */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL MEMBERS</span>
            <Users size={18} color="#0d9488" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>{totalMembers}</span>
            <span style={{ fontSize: '0.75rem', color: newThisMonth > 0 ? '#16a34a' : '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>{newThisMonth > 0 ? `+${newThisMonth} this month` : 'No new members'}</span>
          </div>
        </div>

        {/* ACTIVE NOW CARD */}
        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === 'active' ? 'all' : 'active'))}
          style={{ background: '#fff', border: statusFilter === 'active' ? '1px solid #0d9488' : '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', textAlign: 'left', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIVE NOW</span>
            <RefreshCw size={18} color="#0d9488" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>{activeNow}</span>
            <span style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: '600', marginBottom: '4px' }}>{utilizationPct}% utilization</span>
          </div>
        </button>

        {/* INACTIVE MEMBERS CARD */}
        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === 'inactive' ? 'all' : 'inactive'))}
          style={{ background: '#fff', border: statusFilter === 'inactive' ? '1px solid #64748b' : '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', textAlign: 'left', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>INACTIVE MEMBERS</span>
            <AlertCircle size={18} color="#64748b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>{String(pendingInvites).padStart(2, '0')}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
              {statusFilter === 'inactive' ? 'Filtered view' : 'Click to filter'}
            </span>
          </div>
        </button>

      </div>

      {/* Main Data Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01)' }}>
        {loading ? (
          <div style={{ padding: '5rem', textAlign: 'center', color: '#64748b' }}>Loading team data...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#fcfcfd', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '1.15rem 1.5rem', fontSize: '0.725rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.075em', textTransform: 'uppercase' }}>Member</th>
                    <th style={{ padding: '1.15rem 1.5rem', fontSize: '0.725rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.075em', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '1.15rem 1.5rem', fontSize: '0.725rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.075em', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.875rem' }}>
                  {filteredTeam.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No members found.</td>
                    </tr>
                  ) : (
                    filteredTeam.map(member => {
                      const { dot, bg, text } = getStatusDotAndColor(member.status);
                      return (
                        <tr key={member._id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                              <img 
                                src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`} 
                                alt={member.name} 
                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} 
                              />
                              <div>
                                <p style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.15rem' }}>{member.name}</p>
                                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span 
                              style={{ 
                                fontSize: '0.725rem', 
                                fontWeight: '700', 
                                letterSpacing: '0.025em', 
                                padding: '0.35rem 0.65rem', 
                                borderRadius: '6px', 
                                background: member.role === 'ADMIN' ? 'rgba(13, 148, 136, 0.1)' : '#f1f5f9', 
                                color: member.role === 'ADMIN' ? '#0d9488' : '#475569' 
                              }}
                            >
                              {member.role || 'MEMBER'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot }} />
                              <span style={{ color: '#334155', fontWeight: '500' }}>{member.status || 'Active Now'}</span>
                              {user?._id === member._id && (
                                <button
                                  onClick={() => handleToggleActive(member)}
                                  style={{
                                    marginLeft: '0.6rem',
                                    padding: '0.25rem 0.55rem',
                                    border: '1px solid #e2e8f0',
                                    background: '#fff',
                                    borderRadius: '999px',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    fontWeight: '600',
                                    color: '#0f172a'
                                  }}
                                >
                                  {member.status === 'Active Now' ? 'Set Inactive' : 'Set Active'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Table footer row */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
              <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                SHOWING {filteredTeam.length} OF {team.length} MEMBERS
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button disabled style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>‹</button>
                <button style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#0d9488', fontSize: '0.75rem', fontWeight: '700' }}>1</button>
                <button disabled style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* NEW MEMBER (INVITE) MODAL */}
      {showInviteModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'rgba(15, 23, 42, 0.4)', 
          backdropFilter: 'blur(4px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 999 
        }} onClick={() => setShowInviteModal(false)}>
          <div style={{ 
            background: '#fff', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', 
            padding: '2.5rem', 
            width: '460px',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowInviteModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>Invite New Member</h2>
            
            <form onSubmit={handleInviteMember}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.825rem', fontWeight: '600', color: '#475569' }}>Member Name</label>
                <input 
                  type="text" 
                  value={newMember.name} 
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} 
                  placeholder="e.g. Elena Rodriguez" 
                  style={{ width: '100%', padding: '0.65rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.875rem' }}
                  required 
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.825rem', fontWeight: '600', color: '#475569' }}>Work Email</label>
                <input 
                  type="email" 
                  value={newMember.email} 
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} 
                  placeholder="e.g. e.rod@glacier-med.com" 
                  style={{ width: '100%', padding: '0.65rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.875rem' }}
                  required 
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.825rem', fontWeight: '600', color: '#475569' }}>Role</label>
                <select 
                  value={newMember.role} 
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} 
                  style={{ width: '100%', padding: '0.65rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.875rem' }}
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.825rem', fontWeight: '600', color: '#475569' }}>Status</label>
                  <select 
                    value={newMember.status} 
                    onChange={(e) => setNewMember({ ...newMember, status: e.target.value })} 
                    style={{ width: '100%', padding: '0.65rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.875rem' }}
                  >
                    <option value="Active Now">Active Now</option>
                    <option value="Away">Away</option>
                    <option value="In Meeting">In Meeting</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.825rem', fontWeight: '600', color: '#475569' }}>Workload (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={newMember.workload} 
                    onChange={(e) => setNewMember({ ...newMember, workload: parseInt(e.target.value) || 0 })} 
                    style={{ width: '100%', padding: '0.65rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#475569', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#0d9488', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDirectory;
