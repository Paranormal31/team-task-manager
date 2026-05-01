const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
require('dotenv').config();

const avatarDir = path.join(__dirname, '../client/public/avatars');
const avatarFiles = fs.readdirSync(avatarDir).filter(file => file.endsWith('.png'));

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB.');
    const users = await User.find();
    
    for (const user of users) {
      const randomAvatar = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
      user.avatar = `/avatars/${randomAvatar}`;
      await user.save();
      console.log(`Assigned avatar ${user.avatar} to ${user.name}`);
    }
    
    console.log('Finished assigning avatars.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
