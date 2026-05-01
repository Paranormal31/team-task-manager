const mongoose = require('mongoose');

const projectActivitySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['member_added'], required: true },
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('ProjectActivity', projectActivitySchema);
