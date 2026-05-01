import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, ListTodo, AlertCircle, TrendingUp, User as UserIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selfStatus, setSelfStatus] = useState((user?.status === 'Inactive') ? 'Inactive' : 'Active Now');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        console.log('Dashboard stats:', res.data);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    const interval = setInterval(fetchStats, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSelfStatus((user?.status === 'Inactive') ? 'Inactive' : 'Active Now');
  }, [user?.status]);

  const handleSelfStatusToggle = async (nextStatus) => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    try {
      await api.put(`/users/${userId}`, { status: nextStatus });
      setSelfStatus(nextStatus);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.status = nextStatus;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('Failed to update your status', err);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading insights...</div>;

  const PRIORITY_COLORS = {
    high: '#E57373', // Soft red
    medium: '#FFB74D', // Soft orange
    low: '#81C784' // Soft green
  };

  const overviewCards = [
    { title: 'Total Tasks', value: stats?.totalTasks, icon: <ListTodo color="#4DB6AC" />, color: '#4DB6AC' },
    { title: 'In Progress', value: stats?.statusCounts?.['in-progress'], icon: <Clock color="#FFB74D" />, color: '#FFB74D' },
    { title: 'Completed', value: stats?.statusCounts?.['done'], icon: <CheckCircle2 color="#81C784" />, color: '#81C784' },
    { title: 'Overdue', value: stats?.overdueTasks, icon: <AlertCircle color="#E57373" />, color: '#E57373' },
  ];
  const total = stats?.totalTasks || 0;
  const completed = stats?.statusCounts?.['done'] || 0;
  const efficiency = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
  const memberCount = stats?.totalMembers || stats?.userPerformance?.length || 1;
  const velocity = memberCount > 0 ? (completed / memberCount).toFixed(1) : '0.0';
  const taskDistributionData = [
    { name: 'To Do', value: stats?.statusCounts?.todo || 0, color: '#b2ebf2' },
    { name: 'In Progress', value: stats?.statusCounts?.['in-progress'] || 0, color: '#14b8a6' },
    { name: 'Done', value: stats?.statusCounts?.done || 0, color: '#81C784' }
  ];

  const activities = [];
  if (stats?.userPerformance?.length > 0) {
    stats.userPerformance.forEach((u, i) => {
      activities.push({
        id: `perf-${i}`,
        actor: u.name || 'Team Member',
        action: ' has successfully completed ',
        subject: `${u.completed} tasks`,
        rest: ` in the workspace.`,
        time: i === 0 ? 'Recently' : `${i + 1} hours ago`,
        color: '#14b8a6'
      });
    });
  }
  if (stats?.upcomingDeadlines?.length > 0) {
    stats.upcomingDeadlines.forEach((t, i) => {
      activities.push({
        id: `dl-${i}`,
        actor: t.assignedTo?.name || 'Team Member',
        action: ` is working on the task `,
        subject: t.title,
        rest: ` due on ${new Date(t.dueDate).toLocaleDateString()}.`,
        time: i === 0 ? 'A few hours ago' : `${i * 2} hours ago`,
        color: '#06b6d4'
      });
    });
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Workspace Overview</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time analytics across all your active projects.</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', borderRadius: '10px', padding: '0.25rem' }}>
          <button
            type="button"
            onClick={() => handleSelfStatusToggle('Active Now')}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              background: selfStatus === 'Active Now' ? '#0d9488' : 'transparent',
              color: selfStatus === 'Active Now' ? '#fff' : '#475569'
            }}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => handleSelfStatusToggle('Inactive')}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              background: selfStatus === 'Inactive' ? '#475569' : 'transparent',
              color: selfStatus === 'Inactive' ? '#fff' : '#475569'
            }}
          >
            Inactive
          </button>
        </div>
      </header>

      {/* Overview Stats */}
      <div className="grid" style={{ marginBottom: '2rem' }}>
        {overviewCards.map((card, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', background: `${card.color}15`, borderRadius: '14px' }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>{card.title}</p>
              <p style={{ fontSize: '1.75rem', fontWeight: '800' }}>{card.value || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart and Additional Panels Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Left Column containing Task Distribution and Critical Deadlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Task Distribution Chart */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b' }}>Task Distribution</h2>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>Live status counts</span>
            </div>
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                    {taskDistributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Critical Deadlines Component */}
          <div className="card" style={{ padding: '1.75rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b' }}>Critical Deadlines</h2>
              <button onClick={() => navigate('/efficiency')} style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats?.upcomingDeadlines?.length > 0 ? stats.upcomingDeadlines.slice(0, 3).map(item => {
                const dateObj = item.dueDate ? new Date(item.dueDate) : new Date();
                const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                const day = dateObj.getDate();
                const p = (item.priority || 'medium').toLowerCase();
                let status = 'ONGOING';
                let color = '#0d9488';
                let bg = '#f0fdfa';
                if (p === 'high' || p === 'critical') {
                  status = 'CRITICAL';
                  color = '#ef4444';
                  bg = '#fef2f2';
                } else if (p === 'medium') {
                  status = 'PENDING';
                  color = '#d97706';
                  bg = '#fffbeb';
                }
                return { title: item.title, project: item.project || 'General', month, day, status, color, bg };
              }).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.5rem 0' }}>
                  {/* Date Block */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: item.bg, padding: '0.5rem 0.75rem', borderRadius: '12px', minWidth: '65px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: item.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.month}</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: item.color, lineHeight: '1.1' }}>{item.day}</span>
                  </div>

                  {/* Task Info */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.2rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.project}</p>
                  </div>

                  {/* Status Badge */}
                  <div style={{ background: item.bg, color: item.color, padding: '0.35rem 0.85rem', borderRadius: '30px', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.05em' }}>
                    {item.status}
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>No upcoming deadlines yet.</p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Stream Activity */}
            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b' }}>Stream Activity</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflowY: 'auto', maxHeight: '260px', paddingLeft: '0.25rem' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', left: '10px', top: '12px', bottom: '24px', width: '2px', background: '#f1f5f9', zIndex: 0 }}></div>

                {activities.length > 0 ? activities.map((act) => (
                  <div key={act.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    {/* Activity Bullet Ring */}
                    <div style={{ 
                      minWidth: '22px', 
                      height: '22px', 
                      borderRadius: '50%', 
                      background: '#ffffff', 
                      border: `4px solid ${act.color}`, 
                      marginTop: '2px'
                    }}></div>
                    
                    {/* Activity Text */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: '1.4' }}>
                        <strong style={{ color: '#0f172a' }}>{act.actor}</strong>
                        {act.action}
                        <strong style={{ color: 'var(--accent)', fontWeight: '600' }}>{act.subject}</strong>
                        {act.rest}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', display: 'block' }}>
                        {act.time}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p style={{ fontSize: '0.9rem', color: '#64748b' }}>No recent activity yet.</p>
                )}
              </div>
            </div>

            {/* Priority Breakdown Chart */}
            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <AlertCircle size={20} color="var(--warning)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Priority Distribution</h2>
              </div>
              <div style={{ height: '260px', width: '100%', position: 'relative' }}>
                {stats?.priorityStats?.length > 0 ? (
                  <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.priorityStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.priorityStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name?.toLowerCase()] || 'var(--primary)'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No priority data</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Efficiency & Velocity Panels Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Efficiency Card */}
          <div className="pop-on-hover" onClick={() => navigate('/efficiency')} style={{ background: '#0d9488', color: 'white', padding: '1.75rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ccfbf1', marginBottom: '0.5rem' }}>ACTIVE EFFICIENCY</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>{efficiency}%</span>
                <TrendingUp size={24} style={{ color: '#99f6e4' }} />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#ccfbf1', marginBottom: '1.25rem', opacity: 0.9 }}>{completed} of {total} tasks completed</p>
            </div>
            {/* Progress Bar */}
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', height: '6px', borderRadius: '10px', width: '100%', overflow: 'hidden' }}>
              <div style={{ background: '#ffffff', height: '100%', width: `${efficiency}%` }}></div>
            </div>
          </div>

          {/* Team Velocity Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem', background: '#ffffff' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '0.5rem' }}>TEAM VELOCITY</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>{velocity}</span>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>tasks/member</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>{completed} total tasks completed across {memberCount} {memberCount === 1 ? 'member' : 'members'}</p>
            </div>
            {/* Avatars Stack */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {stats?.userPerformance?.slice(0, 4).map((member, idx) => (
                <div key={idx} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: '2px solid #ffffff', marginLeft: idx === 0 ? 0 : '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} title={member.name}>
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                      {member.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {stats?.userPerformance?.length > 4 && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccfbf1', border: '2px solid #ffffff', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#0f766e', fontWeight: '700' }}>
                  +{stats.userPerformance.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* User Performance (Top Contributors) */}
          <div className="card" style={{ padding: '1.5rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserIcon size={20} color="var(--accent)" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b' }}>Top Contributors</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.userPerformance?.length > 0 ? stats.userPerformance.map((u, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '30px', height: '30px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: 'white' }}>
                        {u.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{u.name || 'Unknown'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)' }}>{u.completed}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}> / {u.total} done</span>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No performance data yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
