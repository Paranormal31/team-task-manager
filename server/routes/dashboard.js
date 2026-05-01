const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all projects the user is part of
    const userProjects = await Project.find({ 'members.user': userId });
    
    if (userProjects.length === 0) {
      return res.json({
        totalTasks: 0,
        statusCounts: { todo: 0, 'in-progress': 0, done: 0 },
        userTasks: 0,
        overdueTasks: 0,
        projectStats: [],
        priorityStats: [],
        userPerformance: [],
        upcomingDeadlines: []
      });
    }

    const projectIds = userProjects.map(p => p._id);
    const projectObjectIds = projectIds.map(id => new mongoose.Types.ObjectId(id));

    // 1. Total tasks & Status Counts
    const totalTasks = await Task.countDocuments({ projectId: { $in: projectIds } });
    const statusCountsArr = await Task.aggregate([
      { $match: { projectId: { $in: projectObjectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusMap = { todo: 0, 'in-progress': 0, done: 0 };
    statusCountsArr.forEach(item => statusMap[item._id] = item.count);

    // 2. Overdue & User tasks
    const userTasksCount = await Task.countDocuments({ assignedTo: userId });
    const overdueCount = await Task.countDocuments({
      projectId: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' }
    });

    // 3. Tasks per Project
    const projectStats = await Task.aggregate([
      { $match: { projectId: { $in: projectObjectIds } } },
      { $group: { 
          _id: '$projectId', 
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
      }},
      { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
      { $unwind: '$project' },
      { $project: { name: '$project.name', total: 1, completed: 1 } }
    ]);

    // 4. Priority Stats
    const priorityStats = await Task.aggregate([
      { $match: { projectId: { $in: projectObjectIds } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // 5. User Performance
    const userPerformance = await Task.aggregate([
      { $match: { projectId: { $in: projectObjectIds }, assignedTo: { $ne: null } } },
      { $group: { 
          _id: '$assignedTo', 
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', avatar: '$user.avatar', total: 1, completed: 1 } },
      { $sort: { completed: -1 } }
    ]);

    // 6. Upcoming Deadlines
    let upcomingDeadlines = await Task.find({
      projectId: { $in: projectIds },
      dueDate: { $gte: new Date() },
      status: { $ne: 'done' }
    })
    .sort({ dueDate: 1 })
    .limit(5)
    .populate('assignedTo', 'name avatar')
    .populate('projectId', 'name');

    if (upcomingDeadlines.length < 3) {
      const moreDeadlines = await Task.find({
        projectId: { $in: projectIds },
        status: { $ne: 'done' },
        _id: { $nin: upcomingDeadlines.map(t => t._id) }
      })
      .sort({ dueDate: 1 })
      .limit(3 - upcomingDeadlines.length)
      .populate('assignedTo', 'name avatar')
      .populate('projectId', 'name');

      upcomingDeadlines = upcomingDeadlines.concat(moreDeadlines);
    }

    const memberIds = new Set();
    userProjects.forEach(proj => {
      if (proj.members) {
        proj.members.forEach(m => {
          if (m.user) {
            memberIds.add(m.user.toString());
          }
        });
      }
    });

    const User = require('../models/User');
    let totalMembers = 0;
    for (const uId of memberIds) {
      const uObj = await User.findById(uId);
      if (uObj && !uObj.name.toLowerCase().includes('admin')) {
        totalMembers++;
      }
    }
    if (totalMembers === 0) totalMembers = 1;

    res.json({
      totalTasks,
      totalMembers,
      statusCounts: statusMap,
      userTasks: userTasksCount,
      overdueTasks: overdueCount,
      projectStats,
      priorityStats,
      userPerformance,
      upcomingDeadlines: upcomingDeadlines.map(t => ({
        id: t._id,
        title: t.title,
        dueDate: t.dueDate,
        assignee: t.assignedTo?.name || 'Unassigned',
        assignee_avatar: t.assignedTo?.avatar,
        project: t.projectId?.name || 'General',
        priority: t.priority || 'medium'
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
