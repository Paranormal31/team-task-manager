const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// Create Task
router.post('/:projectId', auth, async (req, res) => {
  try {
    const { title, description, due_date, priority, assigned_to } = req.body;
    const projectId = req.params.projectId;

    // Check if requester is Admin of the project
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const adminCheck = project.members.find(m => m.user.toString() === req.user.id && m.role === 'admin');
    if (!adminCheck) {
      return res.status(403).json({ message: 'Only admins can create tasks' });
    }

    const task = new Task({
      projectId,
      title,
      description,
      dueDate: due_date,
      priority,
      assignedTo: assigned_to || null
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Task
router.patch('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status, title, description, due_date, priority, assigned_to } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    const member = project.members.find(m => m.user.toString() === req.user.id);

    if (!member) return res.status(403).json({ message: 'Access denied' });

    const userRole = member.role;

    // RBAC
    if (userRole === 'member') {
      if (task.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Members can only update their own assigned tasks' });
      }
      
      if (Object.keys(req.body).some(key => key !== 'status')) {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
    }

    // Update fields
    const updates = req.body;
    if (updates.due_date) updates.dueDate = updates.due_date;
    if (updates.assigned_to) updates.assignedTo = updates.assigned_to;

    Object.keys(updates).forEach(key => {
      if (['title', 'description', 'dueDate', 'priority', 'status', 'assignedTo'].includes(key)) {
        task[key] = updates[key];
      }
    });

    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Task
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    const adminCheck = project.members.find(m => m.user.toString() === req.user.id && m.role === 'admin');

    if (!adminCheck) {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    await Task.findByIdAndDelete(taskId);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
