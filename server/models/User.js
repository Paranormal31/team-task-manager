const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, default: 'MEMBER' },
  status: { type: String, default: 'Active Now' },
  workload: { type: Number, default: 45 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

