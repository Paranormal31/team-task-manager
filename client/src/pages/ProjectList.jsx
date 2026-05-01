import React, { useState, useEffect } from 'react';
import { Plus, Users, ArrowRight, Activity, Dna, Heart, Brain, Search, Bell, Grid, Filter, TrendingUp, MoreHorizontal, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ProjectList = () => {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      try {
        const statsRes = await api.get('/dashboard');
        setDashboardStats(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats in project list', err);
      }
      try {
        const actRes = await api.get('/projects/recent-activity');
        setRecentActivities(actRes.data);
      } catch (err) {
        console.error('Failed to fetch recent activities', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Poll recent activities every 20 seconds so status changes appear live
  const fetchRecentActivities = async () => {
    try {
      const actRes = await api.get('/projects/recent-activity');
      setRecentActivities(actRes.data);
    } catch (err) {
      console.error('Failed to fetch recent activities', err);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchRecentActivities, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (e, projectId, projectName) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(`Delete "${projectName}"? This will also delete its tasks.`);
    if (!confirmed) return;
    try {
      await api.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (err) {
      console.error(err);
      window.alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  // Dynamically map users' loaded projects with icons/completion/status
  const allFilteredProjects = projects.map((p, i) => {
    // Look up real task completion from dashboard stats
    const projectStat = dashboardStats?.projectStats?.find(
      s => s._id?.toString() === p.id?.toString()
    );
    const total = projectStat?.total || 0;
    const completed = projectStat?.completed || 0;
    const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      description: p.description || 'Custom research and trial workspace.',
      status: (p.health || 'on track').toUpperCase(),
      completion,
      iconType: i % 3 === 0 ? 'microscope' : i % 3 === 1 ? 'dna' : 'brain',
      owner: { name: 'You', avatar: currentUser?.avatar }
    };
  }).filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type) => {
    switch (type) {
      case 'microscope':
        return <Activity size={20} color="#14b8a6" />;
      case 'dna':
        return <Dna size={20} color="#14b8a6" />;
      case 'heart':
        return <Heart size={20} color="#14b8a6" />;
      default:
        return <Brain size={20} color="#14b8a6" />;
    }
  };

  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      {/* Top Navbar Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '420px', width: '100%' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search projects or team members..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '0.65rem 1rem 0.65rem 2.75rem', 
              background: '#f1f5f9', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '0.875rem', 
              color: '#1e293b',
              width: '100%' 
            }} 
          />
        </div>

        {/* User profile & controls right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Bell size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          <Grid size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          <div style={{ borderLeft: '1px solid #e2e8f0', height: '24px' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1e293b' }}>Sarah Chen</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Lead Researcher</p>
            </div>
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser?.name || 'User'}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                {(currentUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#0f172a', marginBottom: '0.25rem' }}>Active Projects</h1>
          <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
            You have {projects.length} active project{projects.length === 1 ? '' : 's'} across {dashboardStats?.totalMembers || 1} team member{dashboardStats?.totalMembers === 1 ? '' : 's'}.
          </p>
        </div>

        {/* Header Extra Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Team member avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {dashboardStats?.userPerformance?.slice(0, 3).map((member, idx) => (
              <div key={idx} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', border: '2px solid #ffffff', marginLeft: idx === 0 ? 0 : '-8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} title={member.name}>
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: '700' }}>
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )) || (
              <>
                <img src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=32&h=32" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #fff' }} alt="Avatar" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=32&h=32" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #fff', marginLeft: '-8px' }} alt="Avatar" />
              </>
            )}
            {dashboardStats?.userPerformance?.length > 3 && (
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '9999px', marginLeft: '0.25rem' }}>
                +{dashboardStats.userPerformance.length - 3}
              </span>
            )}
          </div>

          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.825rem', fontWeight: '600', background: '#fff' }}>
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading projects...</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* All projects list */}
          {allFilteredProjects.map(project => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`} 
              className="card pop-on-hover" 
              style={{ 
                textDecoration: 'none', 
                color: 'inherit', 
                display: 'flex', 
                flexDirection: 'column', 
                height: '340px', 
                padding: '1.5rem', 
                background: '#fff', 
                borderRadius: '16px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                justifyContent: 'space-between' 
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getIcon(project.iconType)}
                  </div>
                  <span 
                    style={{ 
                      fontSize: '0.725rem', 
                      fontWeight: '700', 
                      padding: '0.25rem 0.65rem', 
                      borderRadius: '20px',
                      background:
                        project.status === 'DONE' ? '#ecfeff' :
                        project.status === 'OVERDUE' ? '#fff1f2' :
                        project.status === 'ON TRACK' ? '#f0fdf4' : '#fef3c7',
                      color:
                        project.status === 'DONE' ? '#0e7490' :
                        project.status === 'OVERDUE' ? '#b91c1c' :
                        project.status === 'ON TRACK' ? '#15803d' : '#b45309'
                    }}
                  >
                    {project.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', marginTop: '1.25rem' }}>{project.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </p>
              </div>

              <div>
                {/* Progress bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem' }}>
                  <span>Completion</span>
                  <span style={{ color: project.status === 'DONE' ? '#0e7490' : project.status === 'OVERDUE' ? '#e11d48' : project.status === 'ON TRACK' ? '#14b8a6' : '#f59e0b' }}>{project.completion}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                  <div 
                    style={{ 
                      width: `${project.completion}%`, 
                      height: '100%', 
                      background: project.status === 'DONE' ? '#06b6d4' : project.status === 'OVERDUE' ? '#e11d48' : project.status === 'ON TRACK' ? '#0d9488' : '#f59e0b', 
                      borderRadius: '10px' 
                    }}
                  />
                </div>

                {/* Footer section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {project.owner.avatar ? (
                      <img src={project.owner.avatar} alt={project.owner.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700' }}>
                        {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: '0.825rem', fontWeight: '600', color: '#334155' }}>{project.owner.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                    aria-label={`Delete ${project.name}`}
                    title="Delete project"
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </button>
                </div>
              </div>
            </Link>
          ))}

          {/* Special Create New Project Card */}
          <div 
            onClick={() => setShowModal(true)} 
            className="card pop-on-hover" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '340px', 
              border: '1.5px dashed #cbd5e1', 
              borderRadius: '16px', 
              background: 'rgba(248, 250, 252, 0.5)', 
              padding: '1.5rem', 
              textAlign: 'center', 
              cursor: 'pointer' 
            }}
          >
            <div style={{ width: '44px', height: '44px', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', marginBottom: '1.25rem' }}>
              <Plus size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>Create New Project</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '200px' }}>Launch a new clinical trial or research workspace.</p>
          </div>

          {/* Useful Workspace Analytics & Efficiency Card */}
          <Link 
            to="/"
            className="card pop-on-hover" 
            style={{ 
              textDecoration: 'none',
              height: '340px', 
              background: '#0d9488', 
              borderRadius: '16px', 
              border: 'none', 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              color: '#fff', 
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WORKSPACE EFFICIENCY</span>
                <TrendingUp size={16} color="rgba(255, 255, 255, 0.85)" />
              </div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '1rem', marginBottom: '0.25rem' }}>
                {dashboardStats ? (dashboardStats.totalTasks > 0 ? ((dashboardStats.statusCounts?.['done'] || 0) / dashboardStats.totalTasks * 100).toFixed(0) : '0') : '0'}%
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)' }}>Task completion rate across all teams</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Total Tasks</span>
                <span style={{ fontWeight: '700' }}>{dashboardStats?.totalTasks || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Completed Tasks</span>
                <span style={{ fontWeight: '700' }}>{dashboardStats?.statusCounts?.['done'] || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Overdue Tasks</span>
                <span style={{ fontWeight: '700', color: (dashboardStats?.overdueTasks || 0) > 0 ? '#fca5a5' : '#fff' }}>
                  {dashboardStats?.overdueTasks || 0}
                </span>
              </div>
            </div>

            {/* Micro progress indicator bottom */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.25)', borderRadius: '10px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${dashboardStats && dashboardStats.totalTasks > 0 ? Math.min(100, (dashboardStats.statusCounts?.['done'] || 0) / dashboardStats.totalTasks * 100) : 0}%`, 
                  height: '100%', 
                  background: '#fff', 
                  borderRadius: '10px' 
                }}
              ></div>
            </div>
          </Link>
        </div>

        {/* Recent Project Activity Element */}
        <div 
          style={{ 
            background: '#fff', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
            padding: '2rem', 
            marginTop: '2.5rem' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Recent Project Activity</h2>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0d9488', cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((act) => {
                const getBadgeStyle = (s) => {
                  switch (s) {
                    case 'member added':
                      return { color: '#0f766e', background: '#ccfbf1' };
                    case 'done':
                      return { color: '#15803d', background: '#f0fdf4' };
                    case 'in progress':
                      return { color: '#b45309', background: '#fef3c7' };
                    case 'overdue':
                      return { color: '#b91c1c', background: '#fff1f2' };
                    case 'to do':
                    default:
                      return { color: '#1e40af', background: '#eff6ff' };
                  }
                };
                const badge = getBadgeStyle(act.status);
                return (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: badge.background, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={18} color={badge.color} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.925rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.15rem' }}>{act.title}</h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{act.user} • {act.time ? new Date(act.time).toLocaleDateString() : 'recently'}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: badge.color, background: badge.background, padding: '0.25rem 0.65rem', borderRadius: '4px', textTransform: 'uppercase' }}>{act.status}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} color="#0d9488" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.15rem' }}>Start your first project or create a task</h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Project System • just now</p>
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#15803d', background: '#f0fdf4', padding: '0.25rem 0.65rem', borderRadius: '4px' }}>ACTIVE</span>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* New Project Dialog Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>Project Name</label>
                <input 
                  type="text" 
                  value={newProject.name} 
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} 
                  placeholder="e.g. Marketing Q3" 
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b' }}
                  required 
                />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>Description</label>
                <textarea 
                  value={newProject.description} 
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} 
                  placeholder="What is this project about?" 
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b' }}
                  rows="3"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1, padding: '0.65rem 1rem', background: '#fff', borderRadius: '10px' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.65rem 1rem', background: '#0d9488', borderRadius: '10px', color: '#fff' }}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
