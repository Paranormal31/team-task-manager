const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const ProjectActivity = require('../models/ProjectActivity');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all projects for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    let query = { 'members.user': req.user.id };
    
    if (showAll) {
      query = {};
    }

    const projects = await Project.find(query);
    const projectIds = projects.map((p) => p._id);

    const taskStatsByProject = await Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: '$projectId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'done'] },
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const statsMap = new Map(taskStatsByProject.map((s) => [s._id.toString(), s]));
    
    // Format to include role
    const formatted = projects.map(p => {
      const member = p.members.find(m => m.user.toString() === req.user.id);
      const stats = statsMap.get(p._id.toString()) || { total: 0, completed: 0, inProgress: 0, overdue: 0 };
      let health = 'on track';
      if (stats.total > 0 && stats.completed === stats.total) {
        health = 'done';
      } else if (stats.overdue > 0) {
        health = 'overdue';
      } else if (stats.inProgress > 0 || stats.total === 0) {
        health = 'on track';
      } else {
        health = 'at risk';
      }
      return {
        id: p._id,
        name: p.name,
        description: p.description,
        role: member ? member.role : 'member',
        created_at: p.createdAt,
        health
      };
    });
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent project activity across all logged in user's projects
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const userProjects = await Project.find({ 'members.user': req.user.id });
    const projectIds = userProjects.map(p => p._id);

    const recentTasks = await Task.find({ projectId: { $in: projectIds } })
      .populate('assignedTo', 'name email avatar')
      .populate('projectId', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    const formattedTaskActivities = recentTasks.map(t => {
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
        id: `task-${t._id}`,
        title: `${t.title} within ${t.projectId?.name || 'General Project'}`,
        user: t.assignedTo?.name || 'A team member',
        avatar: t.assignedTo?.avatar,
        time: t.updatedAt || t.createdAt,
        status: activityStatus
      };
    });

    const recentMemberEvents = await ProjectActivity.find({
      projectId: { $in: projectIds },
      type: 'member_added'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('projectId', 'name')
      .populate('actorUserId', 'name avatar')
      .populate('targetUserId', 'name avatar');

    const formattedMemberActivities = recentMemberEvents.map((e) => ({
      id: `member-${e._id}`,
      title: `${e.targetUserId?.name || 'A user'} joined ${e.projectId?.name || 'a project'}`,
      user: e.actorUserId?.name || 'Project Admin',
      avatar: e.actorUserId?.avatar,
      time: e.createdAt,
      status: 'member added'
    }));

    const merged = [...formattedTaskActivities, ...formattedMemberActivities]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);

    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const project = new Project({
      name,
      description,
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }]
    });
    
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project details
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check membership
    const member = project.members.find(m => m.user._id.toString() === req.user.id);
    if (!member) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ projectId: req.params.id })
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      id: project._id,
      name: project.name,
      description: project.description,
      role: member.role,
      members: project.members.map(m => ({
        id: m.user._id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role
      })),
      tasks: tasks.map(t => ({
        id: t._id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        due_date: t.dueDate,
        assigned_to: t.assignedTo?._id,
        assignee_name: t.assignedTo?.name,
        assignee_avatar: t.assignedTo?.avatar
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add member to project
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { email, role } = req.body;
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check if requester is Admin
    const adminMember = project.members.find(m => m.user.toString() === req.user.id && m.role === 'admin');
    if (!adminMember) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member
    if (project.members.some(m => m.user.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({ user: user._id, role: role || 'member' });
    await project.save();

    await ProjectActivity.create({
      projectId: project._id,
      type: 'member_added',
      actorUserId: req.user.id,
      targetUserId: user._id,
      metadata: { role: role || 'member' }
    });

    res.json({ message: 'Member added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const adminMember = project.members.find(
      (m) => m.user.toString() === req.user.id && m.role === 'admin'
    );
    if (!adminMember) {
      return res.status(403).json({ message: 'Only admins can delete projects' });
    }

    await Task.deleteMany({ projectId: project._id });
    await ProjectActivity.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
