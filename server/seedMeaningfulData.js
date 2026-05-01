const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const usersData = [
  {
    oldName: 'Admin1',
    name: 'Dr. Aris Thorne',
    email: 'a.thorne@glacier-med.com',
    role: 'ADMIN',
    status: 'Active Now',
    workload: 50,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'User1',
    name: 'Sarah Chen',
    email: 's.chen@glacier-med.com',
    role: 'ADMIN',
    status: 'Active Now',
    workload: 82,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'User2',
    name: 'Marcus Wright',
    email: 'm.wright@glacier-med.com',
    role: 'MEMBER',
    status: 'Away',
    workload: 45,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'User3',
    name: 'Elena Rodriguez',
    email: 'e.rod@glacier-med.com',
    role: 'MEMBER',
    status: 'Active Now',
    workload: 95,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'User4',
    name: 'David Kim',
    email: 'd.kim@glacier-med.com',
    role: 'MEMBER',
    status: 'In Meeting',
    workload: 12,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'User5',
    name: 'Dr. Robert Carter',
    email: 'r.carter@glacier-med.com',
    role: 'MEMBER',
    status: 'Active Now',
    workload: 65,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'User6',
    name: 'Emily Watson',
    email: 'e.watson@glacier-med.com',
    role: 'MEMBER',
    status: 'Away',
    workload: 40,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'User7',
    name: 'James Anderson',
    email: 'j.anderson@glacier-med.com',
    role: 'MEMBER',
    status: 'Active Now',
    workload: 70,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'Admin2',
    name: 'Michael Chang',
    email: 'm.chang@glacier-med.com',
    role: 'ADMIN',
    status: 'Away',
    workload: 25,
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&h=150'
  },
  {
    oldName: 'Admin3',
    name: 'Linda Brooks',
    email: 'l.brooks@glacier-med.com',
    role: 'ADMIN',
    status: 'In Meeting',
    workload: 85,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150'
  },
  {
    name: 'Dr. Lisa Ray',
    email: 'l.ray@glacier-med.com',
    role: 'MEMBER',
    status: 'Active Now',
    workload: 55,
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=150&h=150'
  }
];

const seedMeaningfulData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB to update team directory data...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345', salt);

    for (const item of usersData) {
      // Find by oldName first
      let u = null;
      if (item.oldName) {
        u = await User.findOne({ name: item.oldName });
      }
      if (!u) {
        // Find by name
        u = await User.findOne({ name: item.name });
      }
      if (!u) {
        // Find by email
        u = await User.findOne({ email: item.email });
      }

      if (u) {
        console.log(`Updating user: ${u.name} -> ${item.name}`);
        u.name = item.name;
        u.email = item.email;
        u.role = item.role;
        u.status = item.status;
        u.workload = item.workload;
        u.avatar = item.avatar;
        await u.save();
      } else {
        console.log(`Creating user: ${item.name}`);
        await User.create({
          name: item.name,
          email: item.email,
          password: hashedPassword,
          role: item.role,
          status: item.status,
          workload: item.workload,
          avatar: item.avatar
        });
      }
    }

    mongoose.connection.close();
    console.log('Finished updating team directory to meaningful data.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding meaningful data:', err);
    process.exit(1);
  }
};

seedMeaningfulData();
