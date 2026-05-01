const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all team members/users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create/Invite a new team member
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, role, status, workload, avatar } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Welcome123!', salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'MEMBER',
      status: status || 'Active Now',
      workload: workload || 45,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
    });

    await user.save();

    // Remove password from response
    const returnUser = user.toObject();
    delete returnUser.password;

    res.status(201).json(returnUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a team member's details
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, role, status, workload, avatar } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelf = req.user.id === user._id.toString();
    const onlyStatusUpdate = Object.keys(req.body).length === 1 && Object.prototype.hasOwnProperty.call(req.body, 'status');

    // Users can only toggle their own active/inactive status.
    if (status !== undefined) {
      if (!isSelf || !onlyStatusUpdate || !['Active Now', 'Inactive'].includes(status)) {
        return res.status(403).json({ message: 'You can only update your own active/inactive status' });
      }
      user.status = status;
    } else {
      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;
      if (workload !== undefined) user.workload = workload;
      if (avatar) user.avatar = avatar;
    }

    await user.save();

    const returnUser = user.toObject();
    delete returnUser.password;

    res.json(returnUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a team member
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
