const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Letter = require('./models/Letter');
const Notification = require('./models/Notification');
const Report = require('./models/Report');
const connectDB = require('./config/db');

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing demo data...');
    await User.deleteMany({});
    await Letter.deleteMany({});
    await Notification.deleteMany({});
    await Report.deleteMany({});

    console.log('[Seed] Creating demo campus users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.create([
      {
        name: 'Alex Rivera',
        email: 'alex@campus.edu',
        password: hashedPassword,
        department: 'Computer Science',
        karmaScore: 42
      },
      {
        name: 'Sarah Connor',
        email: 'sarah@campus.edu',
        password: hashedPassword,
        department: 'Design & UX',
        karmaScore: 35
      },
      {
        name: 'David Kim',
        email: 'david@campus.edu',
        password: hashedPassword,
        department: 'Electrical Engineering',
        karmaScore: 28
      },
      {
        name: 'Priya Patel',
        email: 'priya@campus.edu',
        password: hashedPassword,
        department: 'Business & Management',
        karmaScore: 50
      }
    ]);

    const [alex, sarah, david, priya] = users;

    console.log('[Seed] Creating demo campus shoutouts...');
    const letters = await Letter.create([
      {
        author: alex._id,
        recipientName: 'Sarah Connor',
        content:
          'Huge shoutout to Sarah for staying up till 3 AM helping our hackathon team redesign the entire mobile UI before the final pitch! Your Figma components and wireframes saved our project. Best designer on campus!',
        category: 'Hackathons & Tech',
        badge: 'Lifesaver',
        isAnonymous: false,
        reactions: [
          { user: david._id, type: 'applause' },
          { user: priya._id, type: 'heart' },
          { user: alex._id, type: 'inspiring' }
        ],
        likes: [david._id, priya._id, alex._id],
        comments: [
          {
            user: sarah._id,
            text: 'Aww thank you Alex! It was such a blast hacking with the team! 🚀',
            createdAt: new Date(Date.now() - 3600000)
          },
          {
            user: david._id,
            text: 'Well deserved! That live demo blew everyone away.',
            createdAt: new Date(Date.now() - 1800000)
          }
        ],
        status: 'active',
        createdAt: new Date(Date.now() - 14400000) // 4 hours ago
      },
      {
        author: david._id,
        recipientName: 'Prof. Mukherjee & Lab 4 TAs',
        content:
          'Thank you for patiently troubleshooting our micro-controller circuit during today\'s embedded systems practical. We would have failed the simulation without your guidance on the oscilloscope!',
        category: 'Academics',
        badge: 'Problem Solver',
        isAnonymous: false,
        reactions: [
          { user: alex._id, type: 'insightful' },
          { user: priya._id, type: 'applause' }
        ],
        likes: [alex._id, priya._id],
        comments: [
          {
            user: alex._id,
            text: 'Lab 4 TAs are literally the best on campus.',
            createdAt: new Date(Date.now() - 7200000)
          }
        ],
        status: 'active',
        createdAt: new Date(Date.now() - 28800000) // 8 hours ago
      },
      {
        author: priya._id,
        recipientName: 'Campus Cultural Fest Volunteers',
        content:
          'Immense appreciation to the stage logistics and backstage crew who managed sound, lights, and artist hospitality without a single hitch during yesterday’s festival. You all made our college proud!',
        category: 'Club & Cultural',
        badge: 'Team Player',
        isAnonymous: false,
        reactions: [
          { user: alex._id, type: 'applause' },
          { user: sarah._id, type: 'heart' },
          { user: david._id, type: 'inspiring' }
        ],
        likes: [alex._id, sarah._id, david._id],
        comments: [],
        status: 'active',
        createdAt: new Date(Date.now() - 43200000) // 12 hours ago
      },
      {
        author: alex._id,
        recipientName: 'Priya Patel',
        content:
          'Thank you for organizing the weekend peer mentorship session on case studies and financial modeling. You broke down complex concepts so simply and boosted everyone\'s interview confidence.',
        category: 'Peer Mentorship',
        badge: 'Inspirational',
        isAnonymous: true, // Anonymous shoutout!
        reactions: [
          { user: sarah._id, type: 'heart' },
          { user: david._id, type: 'insightful' }
        ],
        likes: [sarah._id, david._id],
        comments: [
          {
            user: priya._id,
            text: 'Whoever sent this, thank you so much! Always happy to help! ❤️',
            createdAt: new Date(Date.now() - 10000000)
          }
        ],
        status: 'active',
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      }
    ]);

    // Create sample in-app notification
    console.log('[Seed] Creating demo notifications...');
    await Notification.create([
      {
        recipient: sarah._id,
        sender: alex._id,
        letter: letters[0]._id,
        type: 'shoutout',
        message: 'Alex Rivera gave you a shoutout on CampusEcho!',
        isRead: false
      },
      {
        recipient: sarah._id,
        sender: david._id,
        letter: letters[0]._id,
        type: 'reaction',
        message: 'David Kim reacted with applause to your shoutout.',
        isRead: false
      },
      {
        recipient: priya._id,
        sender: null,
        letter: letters[3]._id,
        type: 'shoutout',
        message: 'An anonymous peer just posted a campus shoutout for you!',
        isRead: false
      }
    ]);

    // Save bookmarks
    console.log('[Seed] Bookmarking demo letters for Alex...');
    alex.savedLetters = [letters[0]._id, letters[2]._id];
    await alex.save();

    console.log('----------------------------------------------------');
    console.log('✅ CampusEcho Database Seeded Successfully!');
    console.log('Demo Login Credentials:');
    console.log('Email: alex@campus.edu    | Password: password123');
    console.log('Email: sarah@campus.edu   | Password: password123');
    console.log('Email: david@campus.edu   | Password: password123');
    console.log('Email: priya@campus.edu   | Password: password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error.message);
    process.exit(1);
  }
};

seedDatabase();
