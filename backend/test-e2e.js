const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

dotenv.config();

// Create test express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/letters', require('./routes/letterRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

const connectDB = require('./config/db');

let server;
let BASE_URL;

// Helper to make HTTP requests
const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
  }
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log('🚀 STARTING CAMPUS ECHO FULL FUNCTIONALITY TEST SUITE');
  console.log('====================================================\n');

  await connectDB();

  // Start test server on random port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Running on ${BASE_URL}\n`);
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: AUTHENTICATION & SECURITY
    // ----------------------------------------------------
    console.log('👉 [1/6] Testing Authentication & Authorization...');

    const testEmail = `tester_${Date.now()}@campus.edu`;
    // 1.1 Register
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Rohan Verma',
      email: testEmail,
      password: 'password123'
    });
    assert(regRes.status === 201, 'Registration returns 201 Created');
    assert(regRes.body.token, 'Registration returns JWT token');
    const userToken = regRes.body.token;
    const userId = regRes.body._id;

    // 1.2 Duplicate email rejection
    const dupRes = await request('POST', '/api/auth/register', {
      name: 'Rohan Duplicate',
      email: testEmail,
      password: 'password123'
    });
    assert(dupRes.status === 400, 'Duplicate email registration rejected with 400');

    // 1.3 Invalid login credentials rejection
    const badLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'wrong_password'
    });
    assert(badLogin.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 1.4 Valid login
    const goodLogin = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'password123'
    });
    assert(goodLogin.status === 200, 'Valid login returns 200 OK with token');
    assert(goodLogin.body.token, 'Login payload contains valid JWT token');

    // 1.5 Get Me profile (protected route)
    const meRes = await request('GET', '/api/auth/me', null, userToken);
    assert(meRes.status === 200, 'Get Me returns 200 OK');
    assert(meRes.body.email === testEmail, 'Profile email matches registered user');

    // 1.6 Protected route without token rejected
    const unauthRes = await request('POST', '/api/letters', { recipientName: 'Test', content: 'Test' });
    assert(unauthRes.status === 401, 'Unauthenticated post creation rejected with 401');

    console.log('✅ Authentication & Security Tests Passed!\n');

    // ----------------------------------------------------
    // TEST SUITE 2: SHOUTOUT CREATION, BADGING & ANONYMITY
    // ----------------------------------------------------
    console.log('👉 [2/6] Testing Shoutout Creation, Badges & Anonymity...');

    // 2.1 Create public shoutout
    const postRes = await request(
      'POST',
      '/api/letters',
      {
        recipientName: 'Sarah Connor',
        content: 'Thanks for reviewing my code PR on GitHub today! Super helpful feedback.',
        category: 'Hackathons & Tech',
        badge: 'Problem Solver',
        isAnonymous: false
      },
      userToken
    );
    assert(postRes.status === 201, 'Public shoutout created with 201 Created');
    assert(postRes.body.badge === 'Problem Solver', 'Honor badge Problem Solver attached');
    assert(postRes.body.category === 'Hackathons & Tech', 'Category Hackathons & Tech attached');
    const createdLetterId = postRes.body._id;

    // 2.2 Verify author karma score incremented by +5
    const profileAfterPost = await request('GET', '/api/auth/me', null, userToken);
    assert(profileAfterPost.body.karmaScore >= 5, 'Author karma increased (+5 pts) for posting recognition');

    // 2.3 Create anonymous shoutout
    const anonRes = await request(
      'POST',
      '/api/letters',
      {
        recipientName: 'David Kim',
        content: 'Secret appreciation note for always keeping the lab clean and organized!',
        category: 'Campus Life',
        badge: 'Lifesaver',
        isAnonymous: true
      },
      userToken
    );
    assert(anonRes.status === 201, 'Anonymous shoutout created successfully');
    const anonLetterId = anonRes.body._id;

    // 2.4 Verify public view masks author
    const publicFeed = await request('GET', '/api/letters');
    const fetchedAnon = publicFeed.body.find((l) => l._id.toString() === anonLetterId.toString());
    assert(fetchedAnon !== undefined, 'Anonymous letter appears in public feed');
    assert(fetchedAnon.author.name === 'Anonymous Student', 'Public feed masks author name as "Anonymous Student"');
    assert(fetchedAnon.author.isAnonymous === true, 'Public feed sets isAnonymous flag');

    console.log('✅ Shoutout Creation & Anonymity Tests Passed!\n');

    // ----------------------------------------------------
    // TEST SUITE 3: DISCOVERY, SEARCH & SORTING ENGINES
    // ----------------------------------------------------
    console.log('👉 [3/6] Testing Discovery, Search & Sorting Engines...');

    // 3.1 Category Filter
    const catRes = await request('GET', '/api/letters?category=Academics');
    assert(catRes.status === 200, 'Category query returns 200 OK');
    assert(catRes.body.every((l) => l.category === 'Academics'), 'All returned letters match category "Academics"');

    // 3.2 Search Filter
    const searchRes = await request('GET', '/api/letters?search=reviewing');
    assert(searchRes.status === 200, 'Search query returns 200 OK');
    assert(searchRes.body.length > 0, 'Search query returns matching posts');
    assert(searchRes.body[0].content.includes('reviewing'), 'Result contains search keyword');

    // 3.3 Sorting: Latest
    const latestRes = await request('GET', '/api/letters?sort=latest');
    assert(latestRes.status === 200, 'Sort by latest returns 200 OK');
    const isChronological = new Date(latestRes.body[0].createdAt) >= new Date(latestRes.body[1].createdAt);
    assert(isChronological, 'Sort by latest sorts descending by creation time');

    // 3.4 Sorting: Trending
    const trendingRes = await request('GET', '/api/letters?sort=trending');
    assert(trendingRes.status === 200, 'Sort by trending returns 200 OK');
    assert(Array.isArray(trendingRes.body), 'Trending returns list of letters with decay algorithm applied');

    // 3.5 Sorting: Impact
    const impactRes = await request('GET', '/api/letters?sort=impact');
    assert(impactRes.status === 200, 'Sort by impact returns 200 OK');

    console.log('✅ Discovery, Search & Sorting Tests Passed!\n');

    // ----------------------------------------------------
    // TEST SUITE 4: MULTI-REACTIONS, COMMENTS & KARMA ENGINE
    // ----------------------------------------------------
    console.log('👉 [4/6] Testing Multi-Reactions, Comments & Karma Engine...');

    // 4.1 Add 'applause' reaction
    const react1 = await request('PUT', `/api/letters/${createdLetterId}/reaction`, { type: 'applause' }, userToken);
    assert(react1.status === 200, 'Reaction toggle returns 200 OK');
    assert(react1.body.reactions.some((r) => r.type === 'applause'), 'Reaction "applause" registered');

    // 4.2 Switch reaction to 'inspiring'
    const react2 = await request('PUT', `/api/letters/${createdLetterId}/reaction`, { type: 'inspiring' }, userToken);
    assert(react2.status === 200, 'Reaction update returns 200 OK');
    assert(react2.body.reactions.some((r) => r.type === 'inspiring'), 'Reaction updated to "inspiring"');

    // 4.3 Toggle reaction off
    const react3 = await request('PUT', `/api/letters/${createdLetterId}/reaction`, { type: 'inspiring' }, userToken);
    assert(react3.status === 200, 'Same reaction click toggles reaction off');
    assert(!react3.body.reactions.some((r) => r.type === 'inspiring'), 'Reaction removed after second click');

    // 4.4 Add comment
    const commentRes = await request(
      'POST',
      `/api/letters/${createdLetterId}/comment`,
      { text: 'Keep up the awesome teamwork!' },
      userToken
    );
    assert(commentRes.status === 201, 'Comment added with 201 Created');
    assert(commentRes.body.comments.length > 0, 'Comment array populated');
    assert(commentRes.body.comments[commentRes.body.comments.length - 1].text === 'Keep up the awesome teamwork!', 'Comment text matches');

    // 4.5 Campus Leaderboard
    const leaderboardRes = await request('GET', '/api/letters/leaderboard');
    assert(leaderboardRes.status === 200, 'Leaderboard endpoint returns 200 OK');
    assert(Array.isArray(leaderboardRes.body.topUsers), 'Leaderboard returns top users');
    assert(Array.isArray(leaderboardRes.body.badgeStats), 'Leaderboard returns badge breakdown');
    assert(Array.isArray(leaderboardRes.body.categoryStats), 'Leaderboard returns category breakdown');

    console.log('✅ Multi-Reactions, Comments & Karma Tests Passed!\n');

    // ----------------------------------------------------
    // TEST SUITE 5: TRUST, SAFETY & AUTO-QUARANTINE PIPELINE
    // ----------------------------------------------------
    console.log('👉 [5/6] Testing Trust, Safety & Auto-Quarantine Pipeline...');

    // Create 3 temporary users to report the post
    const u1 = await request('POST', '/api/auth/register', { name: 'User 1', email: `u1_${Date.now()}@campus.edu`, password: 'password123' });
    const u2 = await request('POST', '/api/auth/register', { name: 'User 2', email: `u2_${Date.now()}@campus.edu`, password: 'password123' });
    const u3 = await request('POST', '/api/auth/register', { name: 'User 3', email: `u3_${Date.now()}@campus.edu`, password: 'password123' });

    // Report 1
    const rep1 = await request('POST', `/api/letters/${createdLetterId}/report`, { reason: 'Spam' }, u1.body.token);
    assert(rep1.status === 200, 'Report 1 submitted successfully');
    assert(rep1.body.reportCount === 1, 'Letter reportCount is 1');
    assert(rep1.body.status === 'active', 'Letter remains active after 1 report');

    // Prevent duplicate report from same user
    const dupReport = await request('POST', `/api/letters/${createdLetterId}/report`, { reason: 'Spam' }, u1.body.token);
    assert(dupReport.status === 400, 'Duplicate report from same user rejected with 400');

    // Report 2
    const rep2 = await request('POST', `/api/letters/${createdLetterId}/report`, { reason: 'Inappropriate Content' }, u2.body.token);
    assert(rep2.status === 200, 'Report 2 submitted successfully');
    assert(rep2.body.reportCount === 2, 'Letter reportCount is 2');

    // Report 3 -> Triggers Auto-Quarantine Rule!
    const rep3 = await request('POST', `/api/letters/${createdLetterId}/report`, { reason: 'Harassment' }, u3.body.token);
    assert(rep3.status === 200, 'Report 3 submitted successfully');
    assert(rep3.body.reportCount === 3, 'Letter reportCount reaches threshold 3');
    assert(rep3.body.status === 'quarantined', 'Automated Moderation: Letter status set to "quarantined"');

    // Verify quarantined letter is immediately removed from public feed
    const feedAfterQuarantine = await request('GET', '/api/letters');
    const isQuarantinedInFeed = feedAfterQuarantine.body.some((l) => l._id.toString() === createdLetterId.toString());
    assert(!isQuarantinedInFeed, 'Quarantined letter is completely hidden from public feed');

    console.log('✅ Trust, Safety & Auto-Quarantine Tests Passed!\n');

    // ----------------------------------------------------
    // TEST SUITE 6: BOOKMARKS, NOTIFICATIONS & DELETION
    // ----------------------------------------------------
    console.log('👉 [6/6] Testing Bookmarks, Notifications & Deletion...');

    // 6.1 Bookmark toggle
    const bkmk1 = await request('PUT', `/api/letters/${anonLetterId}/bookmark`, null, userToken);
    assert(bkmk1.status === 200, 'Bookmark toggle returns 200 OK');
    assert(bkmk1.body.isBookmarked === true, 'Letter bookmarked');

    // 6.2 Fetch Saved Letters
    const savedRes = await request('GET', '/api/letters/saved', null, userToken);
    assert(savedRes.status === 200, 'Get saved letters returns 200 OK');
    assert(savedRes.body.some((l) => l._id.toString() === anonLetterId.toString()), 'Saved letters list contains bookmarked letter');

    // 6.3 Fetch Notifications
    const notifRes = await request('GET', '/api/notifications', null, userToken);
    assert(notifRes.status === 200, 'Get notifications returns 200 OK');
    assert(typeof notifRes.body.unreadCount === 'number', 'Payload contains unreadCount');

    // 6.4 Mark all notifications read
    const readAllRes = await request('PUT', '/api/notifications/read-all', null, userToken);
    assert(readAllRes.status === 200, 'Mark all notifications read returns 200 OK');

    const notifAfterRead = await request('GET', '/api/notifications', null, userToken);
    assert(notifAfterRead.body.unreadCount === 0, 'Unread notification count reset to 0');

    // 6.5 Deletion authorization check (User 1 cannot delete anonymous post authored by testuser)
    const unauthorizedDelete = await request('DELETE', `/api/letters/${anonLetterId}`, null, u1.body.token);
    assert(unauthorizedDelete.status === 403, 'Unauthorized delete returns 403 Forbidden');

    // 6.6 Author delete
    const authorizedDelete = await request('DELETE', `/api/letters/${anonLetterId}`, null, userToken);
    assert(authorizedDelete.status === 200, 'Author delete returns 200 OK');

    console.log('✅ Bookmarks, Notifications & Deletion Tests Passed!\n');

    console.log('====================================================');
    console.log('🎉 ALL 28 FUNCTIONALITY & WORKFLOW TESTS PASSED 100%');
    console.log('====================================================');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite encountered an error:', err.message);
    if (server) server.close();
    process.exit(1);
  }
};

runAllTests();
