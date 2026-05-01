const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
require('dotenv').config();

const cleanData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for cleaning...');

    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    console.log('Successfully deleted all Users, Projects, and Tasks.');
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning database:', err);
    process.exit(1);
  }
};

cleanData();
