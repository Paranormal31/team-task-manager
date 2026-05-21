import { auth, db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

// Helper to simulate API response wrappers
const wrapResponse = (data) => ({ data });

// Helper to simulate server delay and handle errors
const apiCall = async (fn) => {
  try {
    const result = await fn();
    return wrapResponse(result);
  } catch (err) {
    console.error('API Simulation Error:', err);
    const mockError = new Error(err.message || 'API request failed');
    mockError.response = {
      data: { message: err.message || 'Server error' }
    };
    throw mockError;
  }
};

const api = {
  get: async (url, config) => {
    return apiCall(async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId && !url.includes('/auth/')) {
        throw new Error('Not authenticated');
      }

      // 1. GET /dashboard
      if (url === '/dashboard') {
        // Fetch all projects, tasks, and users in parallel to build aggregations
        const [projectsSnap, tasksSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'tasks')),
          getDocs(collection(db, 'users'))
        ]);

        const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const users = usersSnap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));

        // Find projects current user is a member of
        const userProjects = projects.filter(p => 
          p.members?.some(m => m.user === currentUserId)
        );

        if (userProjects.length === 0) {
          return {
            totalTasks: 0,
            totalMembers: 1,
            statusCounts: { todo: 0, 'in-progress': 0, done: 0 },
            userTasks: 0,
            overdueTasks: 0,
            projectStats: [],
            priorityStats: [],
            userPerformance: [],
            upcomingDeadlines: []
          };
        }

        const projectIds = userProjects.map(p => p.id);

        // Filter tasks that belong to user's projects
        const projectTasks = tasks.filter(t => projectIds.includes(t.projectId));

        // 1. Total Tasks & Status Counts
        const totalTasks = projectTasks.length;
        const statusMap = { todo: 0, 'in-progress': 0, done: 0 };
        projectTasks.forEach(t => {
          const s = t.status || 'todo';
          if (statusMap[s] !== undefined) {
            statusMap[s]++;
          }
        });

        // 2. User Tasks & Overdue Tasks
        const userTasksCount = projectTasks.filter(t => t.assignedTo === currentUserId).length;
        const now = new Date();
        const overdueCount = projectTasks.filter(t => 
          t.status !== 'done' && 
          t.dueDate && 
          new Date(t.dueDate) < now
        ).length;

        // 3. Tasks per Project
        const projectStats = userProjects.map(p => {
          const pTasks = projectTasks.filter(t => t.projectId === p.id);
          return {
            _id: p.id,
            name: p.name,
            total: pTasks.length,
            completed: pTasks.filter(t => t.status === 'done').length
          };
        });

        // 4. Priority Stats
        const priorityCounts = { low: 0, medium: 0, high: 0 };
        projectTasks.forEach(t => {
          const p = t.priority || 'medium';
          if (priorityCounts[p] !== undefined) {
            priorityCounts[p]++;
          }
        });
        const priorityStats = Object.keys(priorityCounts).map(key => ({
          name: key,
          value: priorityCounts[key]
        }));

        // 5. User Performance
        const userPerformanceMap = {};
        // Initialize all users who are members of the user's projects
        const memberIds = new Set();
        userProjects.forEach(p => p.members?.forEach(m => memberIds.add(m.user)));
        
        memberIds.forEach(mId => {
          const u = users.find(usr => usr.id === mId);
          if (u && !u.name?.toLowerCase().includes('admin')) {
            userPerformanceMap[mId] = {
              name: u.name,
              avatar: u.avatar,
              total: 0,
              completed: 0
            };
          }
        });

        // Populate tasks counts per user
        projectTasks.forEach(t => {
          if (t.assignedTo && userPerformanceMap[t.assignedTo]) {
            userPerformanceMap[t.assignedTo].total++;
            if (t.status === 'done') {
              userPerformanceMap[t.assignedTo].completed++;
            }
          }
        });

        const userPerformance = Object.values(userPerformanceMap)
          .sort((a, b) => b.completed - a.completed);

        // 6. Upcoming Deadlines
        const upcomingDeadlines = projectTasks
          .filter(t => t.status !== 'done' && t.dueDate)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5)
          .map(t => {
            const assignee = users.find(u => u.id === t.assignedTo);
            const project = userProjects.find(p => p.id === t.projectId);
            return {
              id: t.id,
              title: t.title,
              dueDate: t.dueDate,
              assignedTo: assignee ? { name: assignee.name, avatar: assignee.avatar } : null,
              project: project ? project.name : 'General',
              priority: t.priority || 'medium'
            };
          });

        // 7. Total members excluding admin user if matching logic
        let totalMembers = 0;
        for (const mId of memberIds) {
          const u = users.find(usr => usr.id === mId);
          if (u && !u.name?.toLowerCase().includes('admin')) {
            totalMembers++;
          }
        }
        if (totalMembers === 0) totalMembers = 1;

        return {
          totalTasks,
          totalMembers,
          statusCounts: statusMap,
          userTasks: userTasksCount,
          overdueTasks: overdueCount,
          projectStats,
          priorityStats,
          userPerformance,
          upcomingDeadlines
        };
      }

      // 2. GET /projects
      if (url === '/projects') {
        const [projectsSnap, tasksSnap] = await Promise.all([
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'tasks'))
        ]);

        const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const showAll = config?.params?.all === 'true';
        
        const userProjects = showAll 
          ? projects 
          : projects.filter(p => p.members?.some(m => m.user === currentUserId));

        const now = new Date();
        const formatted = userProjects.map(p => {
          const member = p.members?.find(m => m.user === currentUserId);
          const pTasks = tasks.filter(t => t.projectId === p.id);
          
          const total = pTasks.length;
          const completed = pTasks.filter(t => t.status === 'done').length;
          const inProgress = pTasks.filter(t => t.status === 'in-progress').length;
          const overdue = pTasks.filter(t => 
            t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now
          ).length;

          let health = 'on track';
          if (total > 0 && completed === total) {
            health = 'done';
          } else if (overdue > 0) {
            health = 'overdue';
          } else if (inProgress > 0 || total === 0) {
            health = 'on track';
          } else {
            health = 'at risk';
          }

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            role: member ? member.role : 'member',
            created_at: p.createdAt,
            health
          };
        });

        return formatted;
      }

      // 3. GET /projects/recent-activity
      if (url === '/projects/recent-activity') {
        const [projectsSnap, tasksSnap, activitiesSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'tasks')),
          getDocs(collection(db, 'project_activities')),
          getDocs(collection(db, 'users'))
        ]);

        const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const userProjects = projects.filter(p => 
          p.members?.some(m => m.user === currentUserId)
        );
        const projectIds = userProjects.map(p => p.id);

        const projectTasks = tasks.filter(t => projectIds.includes(t.projectId));
        const projectActivities = activities.filter(a => projectIds.includes(a.projectId));

        // Format recent tasks
        const recentTasks = projectTasks
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 5);

        const formattedTaskActivities = recentTasks.map(t => {
          const assignee = users.find(u => u.id === t.assignedTo);
          const project = userProjects.find(p => p.id === t.projectId);
          
          let activityStatus = t.status;
          if (t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()) {
            activityStatus = 'overdue';
          } else if (t.status === 'todo') {
            activityStatus = 'to do';
          } else if (t.status === 'in-progress') {
            activityStatus = 'in progress';
          } else if (t.status === 'done') {
            activityStatus = 'done';
          }

          return {
            id: `task-${t.id}`,
            title: `${t.title} within ${project?.name || 'General Project'}`,
            user: assignee?.name || 'A team member',
            avatar: assignee?.avatar,
            time: t.updatedAt || t.createdAt,
            status: activityStatus
          };
        });

        // Format member events
        const recentMemberEvents = projectActivities
          .filter(a => a.type === 'member_added')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);

        const formattedMemberActivities = recentMemberEvents.map(e => {
          const actor = users.find(u => u.id === e.actorUserId);
          const target = users.find(u => u.id === e.targetUserId);
          const project = userProjects.find(p => p.id === e.projectId);

          return {
            id: `member-${e.id}`,
            title: `${target?.name || 'A user'} joined ${project?.name || 'a project'}`,
            user: actor?.name || 'Project Admin',
            avatar: actor?.avatar,
            time: e.createdAt,
            status: 'member added'
          };
        });

        const merged = [...formattedTaskActivities, ...formattedMemberActivities]
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 5);

        return merged;
      }

      // 4. GET /projects/:id
      const projectDetailMatch = url.match(/^\/projects\/([a-zA-Z0-9_-]+)$/);
      if (projectDetailMatch) {
        const projectId = projectDetailMatch[1];
        
        const [projectDoc, tasksSnap, usersSnap] = await Promise.all([
          getDoc(doc(db, 'projects', projectId)),
          getDocs(collection(db, 'tasks')),
          getDocs(collection(db, 'users'))
        ]);

        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }

        const project = { id: projectDoc.id, ...projectDoc.data() };
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const member = project.members?.find(m => m.user === currentUserId);
        if (!member) {
          throw new Error('Access denied');
        }

        const projectTasks = tasks
          .filter(t => t.projectId === projectId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          role: member.role,
          members: project.members.map(m => {
            const userObj = users.find(u => u.id === m.user);
            return {
              id: m.user,
              name: userObj?.name || 'Unknown',
              email: userObj?.email || '',
              avatar: userObj?.avatar || '',
              role: m.role
            };
          }),
          tasks: projectTasks.map(t => {
            const assigneeObj = users.find(u => u.id === t.assignedTo);
            return {
              id: t.id,
              title: t.title,
              description: t.description,
              priority: t.priority,
              status: t.status,
              due_date: t.dueDate,
              assigned_to: t.assignedTo,
              assignee_name: assigneeObj?.name,
              assignee_avatar: assigneeObj?.avatar
            };
          })
        };
      }

      // 5. GET /users
      if (url === '/users') {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
        return users;
      }

      throw new Error(`Unsupported GET endpoint: ${url}`);
    });
  },

  post: async (url, data) => {
    return apiCall(async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('Not authenticated');
      }

      // 1. POST /projects
      if (url === '/projects') {
        const { name, description } = data;
        const projectData = {
          name,
          description: description || '',
          createdBy: currentUserId,
          members: [{ user: currentUserId, role: 'admin' }],
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'projects'), projectData);
        return { id: docRef.id, ...projectData };
      }

      // 2. POST /projects/:id/members
      const projectMembersMatch = url.match(/^\/projects\/([a-zA-Z0-9_-]+)\/members$/);
      if (projectMembersMatch) {
        const projectId = projectMembersMatch[1];
        const { email, role } = data;

        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }

        const project = projectDoc.data();
        const adminCheck = project.members?.find(m => m.user === currentUserId && m.role === 'admin');
        if (!adminCheck) {
          throw new Error('Only admins can add members');
        }

        // Find user by email in Firestore
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const targetUser = users.find(u => u.email === email);
        if (!targetUser) {
          throw new Error('User not found');
        }

        if (project.members?.some(m => m.user === targetUser.id)) {
          throw new Error('User is already a member');
        }

        const updatedMembers = [...(project.members || []), { user: targetUser.id, role: role || 'member' }];
        await updateDoc(projectRef, { members: updatedMembers });

        // Add member added activity
        await addDoc(collection(db, 'project_activities'), {
          projectId,
          type: 'member_added',
          actorUserId: currentUserId,
          targetUserId: targetUser.id,
          metadata: { role: role || 'member' },
          createdAt: new Date().toISOString()
        });

        return { message: 'Member added successfully' };
      }

      // 3. POST /tasks/:projectId
      const createTaskMatch = url.match(/^\/tasks\/([a-zA-Z0-9_-]+)$/);
      if (createTaskMatch) {
        const projectId = createTaskMatch[1];
        const { title, description, due_date, priority, assigned_to } = data;

        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }

        const project = projectDoc.data();
        const adminCheck = project.members?.find(m => m.user === currentUserId && m.role === 'admin');
        if (!adminCheck) {
          throw new Error('Only admins can create tasks');
        }

        const taskData = {
          projectId,
          title,
          description: description || '',
          dueDate: due_date || null,
          priority: priority || 'medium',
          status: 'todo',
          assignedTo: assigned_to || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        return { id: docRef.id, ...taskData };
      }

      // 4. POST /users
      if (url === '/users') {
        const { name, email, role, status, workload, avatar } = data;

        // Check if user exists in Firestore
        const usersSnap = await getDocs(collection(db, 'users'));
        const exists = usersSnap.docs.some(d => d.data().email === email);
        if (exists) {
          throw new Error('User already exists');
        }

        // Create Firestore user document (Note: real Auth account should be seeded or will be created when they try to register)
        const userData = {
          name,
          email,
          role: role || 'MEMBER',
          status: status || 'Active Now',
          workload: workload || 45,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'users'), userData);
        return { id: docRef.id, _id: docRef.id, ...userData };
      }

      throw new Error(`Unsupported POST endpoint: ${url}`);
    });
  },

  put: async (url, data) => {
    return apiCall(async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('Not authenticated');
      }

      // 1. PUT /users/:id (Status / Details update)
      const userUpdateMatch = url.match(/^\/users\/([a-zA-Z0-9_-]+)$/);
      if (userUpdateMatch) {
        const userId = userUpdateMatch[1];
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const isSelf = currentUserId === userId;
        const onlyStatusUpdate = Object.keys(data).length === 1 && Object.prototype.hasOwnProperty.call(data, 'status');

        const updates = {};
        if (data.status !== undefined) {
          if (!isSelf || !onlyStatusUpdate || !['Active Now', 'Inactive'].includes(data.status)) {
            throw new Error('You can only update your own active/inactive status');
          }
          updates.status = data.status;
        } else {
          if (data.name) updates.name = data.name;
          if (data.email) updates.email = data.email;
          if (data.role) updates.role = data.role;
          if (data.workload !== undefined) updates.workload = data.workload;
          if (data.avatar) updates.avatar = data.avatar;
        }

        await updateDoc(userRef, updates);
        return { id: userId, _id: userId, ...userDoc.data(), ...updates };
      }

      throw new Error(`Unsupported PUT endpoint: ${url}`);
    });
  },

  patch: async (url, data) => {
    return apiCall(async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('Not authenticated');
      }

      // 1. PATCH /tasks/:id (RBAC updates)
      const taskUpdateMatch = url.match(/^\/tasks\/([a-zA-Z0-9_-]+)$/);
      if (taskUpdateMatch) {
        const taskId = taskUpdateMatch[1];
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) {
          throw new Error('Task not found');
        }

        const task = taskDoc.data();
        const projectDoc = await getDoc(doc(db, 'projects', task.projectId));
        const project = projectDoc.data();
        const member = project.members?.find(m => m.user === currentUserId);
        if (!member) {
          throw new Error('Access denied');
        }

        const userRole = member.role;

        // RBAC logic matching the backend
        if (userRole === 'member') {
          if (task.assignedTo !== currentUserId) {
            throw new Error('Members can only update their own assigned tasks');
          }
          if (Object.keys(data).some(key => key !== 'status')) {
            throw new Error('Members can only update task status');
          }
        }

        const updates = { ...data, updatedAt: new Date().toISOString() };
        
        // Translate due_date -> dueDate and assigned_to -> assignedTo
        if (updates.due_date !== undefined) {
          updates.dueDate = updates.due_date;
          delete updates.due_date;
        }
        if (updates.assigned_to !== undefined) {
          updates.assignedTo = updates.assigned_to;
          delete updates.assigned_to;
        }

        // Clean out unsupported fields
        const cleanUpdates = {};
        ['title', 'description', 'dueDate', 'priority', 'status', 'assignedTo', 'updatedAt'].forEach(key => {
          if (updates[key] !== undefined) {
            cleanUpdates[key] = updates[key];
          }
        });

        await updateDoc(taskRef, cleanUpdates);
        return { id: taskId, ...task, ...cleanUpdates };
      }

      throw new Error(`Unsupported PATCH endpoint: ${url}`);
    });
  },

  delete: async (url) => {
    return apiCall(async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('Not authenticated');
      }

      // 1. DELETE /projects/:id
      const deleteProjectMatch = url.match(/^\/projects\/([a-zA-Z0-9_-]+)$/);
      if (deleteProjectMatch) {
        const projectId = deleteProjectMatch[1];
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }

        const project = projectDoc.data();
        const adminCheck = project.members?.find(m => m.user === currentUserId && m.role === 'admin');
        if (!adminCheck) {
          throw new Error('Only admins can delete projects');
        }

        // 1. Delete project document
        await deleteDoc(projectRef);

        // 2. Delete tasks and activities in parallel in background or batch
        const [tasksSnap, activitiesSnap] = await Promise.all([
          getDocs(collection(db, 'tasks')),
          getDocs(collection(db, 'project_activities'))
        ]);

        const tasksToDelete = tasksSnap.docs.filter(d => d.data().projectId === projectId);
        const activitiesToDelete = activitiesSnap.docs.filter(d => d.data().projectId === projectId);

        await Promise.all([
          ...tasksToDelete.map(t => deleteDoc(doc(db, 'tasks', t.id))),
          ...activitiesToDelete.map(a => deleteDoc(doc(db, 'project_activities', a.id)))
        ]);

        return { message: 'Project deleted successfully' };
      }

      // 2. DELETE /tasks/:id
      const deleteTaskMatch = url.match(/^\/tasks\/([a-zA-Z0-9_-]+)$/);
      if (deleteTaskMatch) {
        const taskId = deleteTaskMatch[1];
        const taskRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) {
          throw new Error('Task not found');
        }

        const task = taskDoc.data();
        const projectDoc = await getDoc(doc(db, 'projects', task.projectId));
        const project = projectDoc.data();
        const adminCheck = project.members?.find(m => m.user === currentUserId && m.role === 'admin');
        if (!adminCheck) {
          throw new Error('Only admins can delete tasks');
        }

        await deleteDoc(taskRef);
        return { message: 'Task deleted' };
      }

      // 3. DELETE /users/:id
      const deleteUserMatch = url.match(/^\/users\/([a-zA-Z0-9_-]+)$/);
      if (deleteUserMatch) {
        const userId = deleteUserMatch[1];
        await deleteDoc(doc(db, 'users', userId));
        return { message: 'User deleted successfully' };
      }

      throw new Error(`Unsupported DELETE endpoint: ${url}`);
    });
  }
};

export default api;
