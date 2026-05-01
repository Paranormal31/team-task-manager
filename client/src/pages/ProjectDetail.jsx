import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Trash2, User as UserIcon, Search, X, Calendar } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' or 'mine'

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
      if (selectedTask) {
        const updatedTask = res.data.tasks.find(t => t.id === selectedTask.id);
        if (updatedTask) setSelectedTask(updatedTask);
      }
    } catch (err) {
      console.error(err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tasks/${id}`, newTask);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: newMemberEmail });
      setShowMemberModal(false);
      setNewMemberEmail('');
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssigneeUpdate = async (taskId, assigneeId) => {
    try {
      await api.patch(`/tasks/${taskId}`, { assigned_to: assigneeId || null });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      if (selectedTask?.id === taskId) setSelectedTask(null);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading project details...</div>;

  const isAdmin = project.role === 'admin';
  const columns = [
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'in-progress' },
    { title: 'Done', status: 'done' }
  ];

  const filteredTasks = project.tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.assignee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = taskFilter === 'all' || t.assigned_to === user.id;
    return matchesSearch && matchesFilter;
  });
  const hasAnyFilteredTasks = filteredTasks.length > 0;

  return (
    <div>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
             <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{project.name}</h1>
             <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)' }}>{project.role.toUpperCase()}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>{project.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isAdmin && (
            <>
              <button className="btn-outline" onClick={() => setShowMemberModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} />
                <span>Add Member</span>
              </button>
              <button className="btn-primary" onClick={() => setShowTaskModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} />
                <span>New Task</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ maxWidth: '400px', flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search tasks or users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.35rem', borderRadius: '10px' }}>
          <button 
            onClick={() => setTaskFilter('all')}
            style={{ 
              padding: '0.4rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem',
              fontWeight: '600',
              background: taskFilter === 'all' ? 'var(--primary)' : 'transparent',
              color: taskFilter === 'all' ? 'white' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All Tasks
          </button>
          <button 
            onClick={() => setTaskFilter('mine')}
            style={{ 
              padding: '0.4rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem',
              fontWeight: '600',
              background: taskFilter === 'mine' ? 'var(--primary)' : 'transparent',
              color: taskFilter === 'mine' ? 'white' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            My Tasks
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', minHeight: '600px' }}>
        {columns.map(col => (
          <div key={col.status} style={{ flex: 1, background: '#f1f5f9', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {col.title} ({filteredTasks.filter(t => t.status === col.status).length})
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredTasks.filter(t => t.status === col.status).map(task => (
                <div key={task.id} className="card" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} 
                        style={{ 
                          background: 'transparent', 
                          color: 'var(--text-muted)', 
                          padding: '0.5rem', 
                          margin: '-0.5rem', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{task.title}</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                         {task.assignee_avatar ? (
                           <img src={task.assignee_avatar} alt={task.assignee_name} style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                         ) : (
                           <UserIcon size={12} />
                         )}
                         <span>{task.assignee_name || 'Unassigned'}</span>
                      </div>
                      {task.due_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: new Date(task.due_date) < new Date() && task.status !== 'done' ? 'var(--danger)' : 'var(--text-muted)' }}>
                          <Calendar size={12} />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredTasks.filter(t => t.status === col.status).length === 0 && (
                <div
                  style={{
                    border: '1px dashed var(--border)',
                    borderRadius: '12px',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.65)'
                  }}
                >
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: isAdmin ? '0.75rem' : 0 }}>
                    {hasAnyFilteredTasks
                      ? `No tasks in ${col.title.toLowerCase()} right now.`
                      : 'No tasks match your current search or filter.'}
                  </p>
                  {isAdmin && hasAnyFilteredTasks && (
                    <button
                      className="btn-outline"
                      onClick={() => setShowTaskModal(true)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      <Plus size={14} />
                      <span>Add Task</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {!hasAnyFilteredTasks && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.85rem 1rem',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.6)',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}
        >
          No tasks found for this view. Try clearing search or switching between All Tasks and My Tasks.
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span className={`badge badge-${selectedTask.priority}`} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{selectedTask.priority}</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1.5, overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Description</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Status</label>
                  <select 
                    value={selectedTask.status} 
                    onChange={(e) => handleStatusUpdate(selectedTask.id, e.target.value)}
                    disabled={!isAdmin && selectedTask.assigned_to !== user.id}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Assignee</label>
                  {isAdmin ? (
                    <select
                      value={selectedTask.assigned_to || ''}
                      onChange={(e) => handleAssigneeUpdate(selectedTask.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {project.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {selectedTask.assignee_avatar ? (
                        <img src={selectedTask.assignee_avatar} alt={selectedTask.assignee_name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', background: 'var(--bg-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserIcon size={16} />
                        </div>
                      )}
                      <span style={{ fontSize: '0.9rem' }}>{selectedTask.assignee_name || 'Unassigned'}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Due Date</label>
                  <p style={{ fontSize: '0.9rem' }}>{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No date set'}</p>
                </div>

                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="btn-outline" 
                    style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Task</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Task Modal (Create) */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
                <input type="text" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Due Date</label>
                  <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({...newTask, due_date: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Assign To</label>
                <select value={newTask.assigned_to} onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}>
                  <option value="">Unassigned</option>
                  {project.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>User Email</label>
                <input 
                  type="email" 
                  value={newMemberEmail} 
                  onChange={(e) => setNewMemberEmail(e.target.value)} 
                  placeholder="colleague@example.com" 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add to Project</button>
              </div>
            </form>
            
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Current Members</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.members.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{m.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</p>
                      </div>
                    </div>
                    <span className="badge" style={{ fontSize: '0.65rem' }}>{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
