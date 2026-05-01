const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Task = require('./models/Task');
  const agg = await Task.aggregate([
    { $match: { assignedTo: { $ne: null } } },
    { $group: { 
        _id: '$assignedTo', 
        total: { $sum: 1 }, 
        completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
    }},
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { name: '$user.name', avatar: '$user.avatar', total: 1, completed: 1 } },
    { $sort: { completed: -1 } },
    { $limit: 5 }
  ]);
  console.log(JSON.stringify(agg, null, 2));
  process.exit(0);
});
