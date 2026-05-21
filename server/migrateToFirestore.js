const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../client/.env') });

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const ProjectActivity = require('./models/ProjectActivity');

// Import Firebase Client SDK (using require since server uses CommonJS)
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const migrate = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB.');

    // 1. Fetch all users from MongoDB
    const mongoUsers = await User.find({});
    console.log(`Found ${mongoUsers.length} users in MongoDB.`);

    const emailToUid = {};

    console.log('\n--- Migrating Users to Firebase Auth & Firestore ---');
    for (const u of mongoUsers) {
      let uid = '';
      const email = u.email.toLowerCase();

      try {
        // Try creating the Firebase Auth account with default password '12345'
        const userCred = await createUserWithEmailAndPassword(auth, email, '12345');
        uid = userCred.user.uid;
        console.log(`Created Firebase Auth user: ${email} (UID: ${uid})`);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          // If already exists, sign in to retrieve the UID
          const userCred = await signInWithEmailAndPassword(auth, email, '12345');
          uid = userCred.user.uid;
          console.log(`User already exists, retrieved UID: ${email} (UID: ${uid})`);
        } else {
          console.error(`Firebase Auth creation failed for ${email}: ${err.message}. Using Mongoose ID as fallback UID.`);
          uid = u._id.toString();
        }
      }

      emailToUid[email] = uid;
      emailToUid[u._id.toString()] = uid; // Also map Mongoose ID to Firebase UID for lookup!

      // Write user profile to Firestore
      const userProfile = {
        name: u.name,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
        role: u.role || 'MEMBER',
        status: u.status || 'Active Now',
        workload: u.workload !== undefined ? u.workload : 45,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
      };

      await setDoc(doc(db, 'users', uid), userProfile);
      console.log(`Saved Firestore profile for user: ${u.name}`);
    }

    // 2. Fetch and migrate Projects
    const mongoProjects = await Project.find({});
    console.log(`\nFound ${mongoProjects.length} projects in MongoDB.`);

    console.log('\n--- Migrating Projects to Firestore ---');
    for (const p of mongoProjects) {
      const createdByUid = emailToUid[p.createdBy.toString()] || null;

      const members = [];
      if (p.members) {
        for (const m of p.members) {
          const mUid = emailToUid[m.user.toString()];
          if (mUid) {
            members.push({
              user: mUid,
              role: m.role || 'member'
            });
          }
        }
      }

      const projectData = {
        name: p.name,
        description: p.description || '',
        createdBy: createdByUid,
        members: members,
        createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString()
      };

      // Keep original project ID to maintain task mappings!
      await setDoc(doc(db, 'projects', p._id.toString()), projectData);
      console.log(`Migrated Project: "${p.name}" (ID: ${p._id})`);
    }

    // 3. Fetch and migrate Tasks
    const mongoTasks = await Task.find({});
    console.log(`\nFound ${mongoTasks.length} tasks in MongoDB.`);

    console.log('\n--- Migrating Tasks to Firestore ---');
    for (const t of mongoTasks) {
      const assignedToUid = (t.assignedTo && emailToUid[t.assignedTo.toString()]) || null;

      const taskData = {
        projectId: t.projectId.toString(),
        title: t.title,
        description: t.description || '',
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        priority: t.priority || 'medium',
        status: t.status || 'todo',
        assignedTo: assignedToUid,
        createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: t.updatedAt ? t.updatedAt.toISOString() : new Date().toISOString()
      };

      await setDoc(doc(db, 'tasks', t._id.toString()), taskData);
      console.log(`Migrated Task: "${t.title}" (ID: ${t._id})`);
    }

    // 4. Fetch and migrate Project Activities
    const mongoActivities = await ProjectActivity.find({});
    console.log(`\nFound ${mongoActivities.length} activities in MongoDB.`);

    console.log('\n--- Migrating Activities to Firestore ---');
    for (const a of mongoActivities) {
      const actorUid = a.actorUserId ? emailToUid[a.actorUserId.toString()] : null;
      const targetUid = a.targetUserId ? emailToUid[a.targetUserId.toString()] : null;

      const activityData = {
        projectId: a.projectId.toString(),
        type: a.type || 'member_added',
        actorUserId: actorUid,
        targetUserId: targetUid,
        metadata: a.metadata || {},
        createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
      };

      await setDoc(doc(db, 'project_activities', a._id.toString()), activityData);
      console.log(`Migrated Activity: "${a.type}" (ID: ${a._id})`);
    }

    console.log('\n=============================================');
    console.log('🎉 SUCCESS: MongoDB to Firestore data migration complete!');
    console.log('=============================================');
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed with critical error:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

migrate();
