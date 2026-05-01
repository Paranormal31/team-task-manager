const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for custom seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345', salt);

    // Create Admins
    const admins = [];
    for (let i = 1; i <= 3; i++) {
      const admin = await User.create({
        name: `Admin${i}`,
        email: `admin${i}@gmail.com`,
        password: hashedPassword
      });
      admins.push(admin);
    }

    // Create Users
    const users = [];
    for (let i = 1; i <= 7; i++) {
      const user = await User.create({
        name: `User${i}`,
        email: `user${i}@gmail.com`,
        password: hashedPassword
      });
      users.push(user);
    }

    console.log('Admins and Users created.');

    // Create Projects (one for each admin)
    const projects = [];
    const projectNames = ['Strategic Initiative Alpha', 'Operational Excellence Beta', 'Innovation Lab Gamma'];
    
    for (let i = 0; i < 3; i++) {
      const project = await Project.create({
        name: projectNames[i],
        description: `High-priority project managed by ${admins[i].name}.`,
        createdBy: admins[i]._id,
        members: [
          { user: admins[i]._id, role: 'admin' },
          ...users.map(u => ({ user: u._id, role: 'member' }))
        ]
      });
      projects.push(project);
    }

    console.log('Projects created and users added.');

    // Generate Tasks
    // 3 admins * 7 users * 4 tasks = 84 tasks
    const priorities = ['low', 'medium', 'high', 'medium']; // Varying difficulty
    const taskTypes = ['Analyze', 'Implement', 'Fix', 'Design', 'Review', 'Document', 'Test', 'Optimize'];
    const subjects = ['Database', 'UI Component', 'API Endpoint', 'Security Protocol', 'User Workflow', 'Performance Bottleneck', 'Deployment Pipeline', 'Client Requirement'];

    let taskCounter = 0;
    const tasksToCreate = [];

    for (let a = 0; a < 3; a++) { // Each admin
      const admin = admins[a];
      const project = projects[a];

      for (let u = 0; u < 7; u++) { // To each user
        const targetUser = users[u];

        for (let t = 0; t < 4; t++) { // 4 tasks each
          const type = taskTypes[(taskCounter) % taskTypes.length];
          const subject = subjects[(taskCounter + u) % subjects.length];
          
          tasksToCreate.push({
            projectId: project._id,
            title: `${type} ${subject} #${taskCounter + 1}`,
            description: `This task requires you to ${type.toLowerCase()} the ${subject.toLowerCase()} as part of ${project.name}. Assigned by ${admin.name}.`,
            priority: priorities[t],
            status: ['todo', 'in-progress'][t % 2],
            assignedTo: targetUser._id,
            dueDate: new Date(Date.now() + (t + 1) * 86400000) // 1-4 days from now
          });
          taskCounter++;
        }
      }
    }

    await Task.insertMany(tasksToCreate);
    console.log(`${tasksToCreate.length} Tasks created.`);

    // Update login info file
    let loginInfo = 'TEAM TASK MANAGER - PROJECT LOGIN INFO\n';
    loginInfo += '========================================\n\n';
    loginInfo += 'ADMIN ACCOUNTS (Password: 12345)\n';
    admins.forEach(a => loginInfo += `- ${a.name}: ${a.email}\n`);
    loginInfo += '\nUSER ACCOUNTS (Password: 12345)\n';
    users.forEach(u => loginInfo += `- ${u.name}: ${u.email}\n`);
    loginInfo += '\n========================================\n';

    fs.writeFileSync(path.join(__dirname, '..', 'project_login_info.txt'), loginInfo);
    console.log('project_login_info.txt updated.');

    mongoose.connection.close();
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
