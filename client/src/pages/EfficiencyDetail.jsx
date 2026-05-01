import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, CheckCircle2, ListTodo, Award, Briefcase, RefreshCw } from 'lucide-react';
import api from '../services/api';

const EfficiencyDetail = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const total = stats?.totalTasks || 0;
  const completed = stats?.statusCounts?.['done'] || 0;
  const efficiency = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
  const memberCount = stats?.totalMembers || stats?.userPerformance?.length || 1;
  const velocity = memberCount > 0 ? (completed / memberCount).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <p style={{ fontWeight: 500 }}>Loading efficiency metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-secondary" 
            style={{ 
              background: '#ffffff', 
              border: '1px solid var(--border)', 
              color: 'var(--text-main)', 
              padding: '0.625rem', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow)'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Active Efficiency Metrics</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Comprehensive breakdown of team and project productivity.</p>
          </div>
        </div>

        <button 
          onClick={fetchStats} 
          className="btn" 
          style={{ 
            background: 'var(--bg-card)', 
            color: 'var(--text-main)', 
            border: '1px solid var(--border)', 
            padding: '0.75rem 1.25rem', 
            borderRadius: '12px', 
            fontWeight: 600, 
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </header>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* KPI Card 1: Efficiency Rate */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.75rem', borderLeft: '4px solid #0d9488' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Efficiency Rate</p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{efficiency}%</h2>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} color="#15803d" />
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{completed} of {total} total tasks completed</p>
          </div>
          {/* Progress Bar */}
          <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '10px', width: '100%', overflow: 'hidden' }}>
            <div style={{ background: '#0d9488', height: '100%', width: `${efficiency}%`, transition: 'width 0.4s ease' }}></div>
          </div>
        </div>

        {/* KPI Card 2: Task Throughput */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.75rem', borderLeft: '4px solid #0284c7' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tasks Distribution</p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{total} <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-muted)' }}>Tasks</span></h2>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#f0f9ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ListTodo size={24} color="#0369a1" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Completed</p>
                <p style={{ fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>{completed}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>In Progress</p>
                <p style={{ fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>{stats?.statusCounts?.['in-progress'] || 0}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Todo / Next up</p>
                <p style={{ fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>{stats?.statusCounts?.['todo'] || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Card 3: Team Velocity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.75rem', borderLeft: '4px solid #8b5cf6' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg Team Velocity</p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{velocity} <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-muted)' }}>Tasks/member</span></h2>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#f5f3ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={24} color="#6d28d9" />
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Calculated across {memberCount} active {memberCount === 1 ? 'member' : 'members'}</p>
          </div>
        </div>
      </div>

      {/* Breakdowns Row: Members vs Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2.5rem' }}>
        {/* Column 1: Top Contributors & Team Efficiency */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <Award size={22} color="#0d9488" />
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>Top Contributors & Members</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Breakdown of task completions per team member.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stats?.userPerformance?.length > 0 ? (
              stats.userPerformance.map((user, idx) => {
                const userEfficiency = user.total > 0 ? ((user.completed / user.total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: '1.5px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                              {user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>{user.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.completed} of {user.total} tasks completed</p>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0d9488' }}>{userEfficiency}%</span>
                    </div>
                    {/* User Progress Bar */}
                    <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '10px', width: '100%', overflow: 'hidden' }}>
                      <div style={{ background: '#0d9488', height: '100%', width: `${userEfficiency}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No team performance data available</div>
            )}
          </div>
        </div>

        {/* Column 2: Project Performance Analysis */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <Briefcase size={22} color="#0284c7" />
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>Project Efficiency Breakdown</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Performance metrics by project.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stats?.projectStats?.length > 0 ? (
              stats.projectStats.map((proj, idx) => {
                const projEfficiency = proj.total > 0 ? ((proj.completed / proj.total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>{proj.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{proj.completed} of {proj.total} tasks completed</p>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0284c7' }}>{projEfficiency}%</span>
                    </div>
                    {/* Project Progress Bar */}
                    <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '10px', width: '100%', overflow: 'hidden' }}>
                      <div style={{ background: '#0284c7', height: '100%', width: `${projEfficiency}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No project data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EfficiencyDetail;
