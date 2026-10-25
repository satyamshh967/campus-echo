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

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Central Error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON payload in request' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Resource not found with invalid ID: ${err.value}` });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const connectDB = require('./config/db');

let server;
let BASE_URL;

// Helper to make raw HTTP requests (allows sending raw string bodies, malformed JSON, etc.)
const rawRequest = (method, path, body = null, token = null, rawContentType = 'application/json') => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {};
    if (rawContentType) {
      headers['Content-Type'] = rawContentType;
    }
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
    if (body !== null) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
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

const runSecurityAndEdgeTests = async () => {
  console.log('====================================================');
  console.log('🛡️  CAMPUS ECHO SECURITY, BOUNDARY & STRESS TESTS');
  console.log('====================================================\n');

  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      console.log(`[Edge Test Server] Running on ${BASE_URL}\n`);
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // SUITE 1: SECURITY, INJECTION & MALFORMED PAYLOADS
    // ----------------------------------------------------
    console.log('👉 [1/4] Testing Security, Injections & Malformed Payloads...');

    // 1.1 Special regex chars in search query (avoids regex crash/DOS)
    const regexCharsRes = await rawRequest('GET', '/api/letters?search=(*+?[]^$)\\\\');
    assert(regexCharsRes.status === 200, 'Regex injection in search safely escaped and handled with 200 OK');

    // 1.2 Malformed JSON body
    const badJsonRes = await rawRequest('POST', '/api/auth/login', '{ email: "test@campus.edu", bad json');
    assert(badJsonRes.status === 400, 'Malformed JSON payload safely rejected with 400 Bad Request');

    // 1.3 NoSQL injection in login payload (object instead of string)
    const nosqlLoginRes = await rawRequest('POST', '/api/auth/login', {
      email: { $gt: '' },
      password: 'password123'
    });
    assert(nosqlLoginRes.status === 400, 'NoSQL injection attempt in login safely rejected with 400 Bad Request');

    // 1.4 NoSQL injection in registration payload
    const nosqlRegRes = await rawRequest('POST', '/api/auth/register', {
      name: { $ne: null },
      email: { $gt: '' },
      password: 'password123'
    });
    assert(nosqlRegRes.status === 400, 'NoSQL injection attempt in registration safely rejected with 400 Bad Request');

    // 1.5 Corrupted / forged JWT Token
    const forgedTokenRes = await rawRequest('GET', '/api/auth/me', null, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');
    assert(forgedTokenRes.status === 401, 'Corrupted JWT signature safely rejected with 401 Unauthorized');

    // 1.6 Malformed Bearer header
    const malformedHeaderRes = await rawRequest('GET', '/api/auth/me', null, '');
    assert(malformedHeaderRes.status === 401, 'Empty Bearer header rejected with 401 Unauthorized');

    console.log('✅ Security & Injection Tests Passed!\n');

    // ----------------------------------------------------
    // SUITE 2: BOUNDARY & VALIDATION EDGE CASES
    // ----------------------------------------------------
    console.log('👉 [2/4] Testing Boundary Conditions & Field Length Limits...');

    // Register valid user for tests
    const userEmail = `security_user_${Date.now()}@campus.edu`;
    const regRes = await rawRequest('POST', '/api/auth/register', {
      name: 'Security Tester',
      email: userEmail,
      password: 'validpassword123'
    });
    const token = regRes.body.token;

    // 2.1 Password too short (< 6 chars)
    const shortPassRes = await rawRequest('POST', '/api/auth/register', {
      name: 'Shorty',
      email: `short_${Date.now()}@campus.edu`,
      password: '123'
    });
    assert(shortPassRes.status === 400, 'Password < 6 chars rejected with 400 Bad Request');

    // 2.2 Name too long (> 50 chars)
    const longNameRes = await rawRequest('POST', '/api/auth/register', {
      name: 'A'.repeat(55),
      email: `longname_${Date.now()}@campus.edu`,
      password: 'validpassword123'
    });
    assert(longNameRes.status === 400, 'Name > 50 chars rejected with 400 Bad Request');

    // 2.3 Recipient name too long (> 100 chars)
    const longRecipientRes = await rawRequest(
      'POST',
      '/api/letters',
      {
        recipientName: 'R'.repeat(105),
        content: 'Valid content here.'
      },
      token
    );
    assert(longRecipientRes.status === 400, 'Recipient name > 100 chars rejected with 400 Bad Request');

    // 2.4 Content too long (> 3000 chars)
    const longContentRes = await rawRequest(
      'POST',
      '/api/letters',
      {
        recipientName: 'Valid Recipient',
        content: 'C'.repeat(3050)
      },
      token
    );
    assert(longContentRes.status === 400, 'Letter content > 3000 chars rejected with 400 Bad Request');

    // 2.5 Whitespace-only recipient name
    const whiteRecipientRes = await rawRequest(
      'POST',
      '/api/letters',
      {
        recipientName: '       ',
        content: 'Valid content'
      },
      token
    );
    assert(whiteRecipientRes.status === 400, 'Whitespace-only recipient name rejected with 400 Bad Request');

    // 2.6 Whitespace-only content
    const whiteContentRes = await rawRequest(
      'POST',
      '/api/letters',
      {
        recipientName: 'Valid Recipient',
        content: '       '
      },
      token
    );
    assert(whiteContentRes.status === 400, 'Whitespace-only content rejected with 400 Bad Request');

    // Create a valid letter for comment tests
    const letterRes = await rawRequest(
      'POST',
      '/api/letters',
      {
        recipientName: 'Prof. Miller',
        content: 'Thank you for explaining graph algorithms so clearly in class!'
      },
      token
    );
    const validLetterId = letterRes.body._id;

    // 2.7 Comment too long (> 500 chars)
    const longCommentRes = await rawRequest(
      'POST',
      `/api/letters/${validLetterId}/comment`,
      { text: 'X'.repeat(550) },
      token
    );
    assert(longCommentRes.status === 400, 'Comment > 500 chars rejected with 400 Bad Request');

    // 2.8 Whitespace-only comment
    const whiteCommentRes = await rawRequest(
      'POST',
      `/api/letters/${validLetterId}/comment`,
      { text: '      ' },
      token
    );
    assert(whiteCommentRes.status === 400, 'Whitespace-only comment rejected with 400 Bad Request');

    console.log('✅ Boundary & Field Limit Tests Passed!\n');

    // ----------------------------------------------------
    // SUITE 3: RESOURCE ID HANDLING & ROUTE ROBUSTNESS
    // ----------------------------------------------------
    console.log('👉 [3/4] Testing Resource IDs & Route Robustness...');

    // 3.1 Malformed ObjectId in GET
    const badIdGet = await rawRequest('GET', '/api/letters/this-is-not-an-objectid');
    assert(badIdGet.status === 400, 'Malformed letter ID in GET returns 400 Bad Request');

    // 3.2 Non-existent but valid format ObjectId
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundGet = await rawRequest('GET', `/api/letters/${nonExistentId}`);
    assert(notFoundGet.status === 404, 'Non-existent valid ObjectId returns 404 Not Found');

    // 3.3 Malformed ObjectId in reaction PUT
    const badIdReaction = await rawRequest('PUT', '/api/letters/bad_id/reaction', { type: 'heart' }, token);
    assert(badIdReaction.status === 400, 'Malformed letter ID in reaction returns 400 Bad Request');

    // 3.4 Invalid reaction type (e.g. 'thumbsdown' or 'dislike')
    const badReactionType = await rawRequest('PUT', `/api/letters/${validLetterId}/reaction`, { type: 'dislike' }, token);
    assert(badReactionType.status === 400, 'Invalid reaction type rejected with 400 Bad Request');

    // 3.5 Malformed ObjectId in comment POST
    const badIdComment = await rawRequest('POST', '/api/letters/bad_id/comment', { text: 'Hello' }, token);
    assert(badIdComment.status === 400, 'Malformed letter ID in comment returns 400 Bad Request');

    // 3.6 Non-existent endpoint
    const notFoundRoute = await rawRequest('GET', '/api/some/random/endpoint');
    assert(notFoundRoute.status === 404, 'Undefined route correctly returns 404 Route not found');

    console.log('✅ Resource ID & Route Robustness Tests Passed!\n');

    // ----------------------------------------------------
    // SUITE 4: CONCURRENCY & CASE-INSENSITIVITY TESTS
    // ----------------------------------------------------
    console.log('👉 [4/4] Testing Concurrency, Race Conditions & Sanitization...');

    // 4.1 Case-insensitive login with extra spaces in email
    const mixedEmail = `  MixEd.CaSe_${Date.now()}@Campus.Edu  `;
    const regMixed = await rawRequest('POST', '/api/auth/register', {
      name: 'Mixed Case User',
      email: mixedEmail,
      password: 'password123'
    });
    assert(regMixed.status === 201, 'Mixed-case registration with leading/trailing spaces accepted');

    // Login with all lowercase
    const loginLower = await rawRequest('POST', '/api/auth/login', {
      email: mixedEmail.toLowerCase().trim(),
      password: 'password123'
    });
    assert(loginLower.status === 200, 'Login with lowercase email succeeds');

    // Login with all uppercase
    const loginUpper = await rawRequest('POST', '/api/auth/login', {
      email: mixedEmail.toUpperCase().trim(),
      password: 'password123'
    });
    assert(loginUpper.status === 200, 'Login with uppercase email succeeds (case-insensitive)');

    // 4.2 High-concurrency reaction stress test:
    // Create 10 distinct users and have them all react simultaneously using Promise.all
    console.log('  ⚡ Simulating 10 simultaneous concurrent reactions...');
    const concurrentUsers = await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        rawRequest('POST', '/api/auth/register', {
          name: `Concurrent User ${i}`,
          email: `concurrent_${i}_${Date.now()}@campus.edu`,
          password: 'password123'
        })
      )
    );

    const reactionTypes = ['applause', 'heart', 'insightful', 'inspiring'];

    // Fire 10 simultaneous reactions on the valid letter
    const concurrentReactionResults = await Promise.all(
      concurrentUsers.map((u, i) =>
        rawRequest(
          'PUT',
          `/api/letters/${validLetterId}/reaction`,
          { type: reactionTypes[i % reactionTypes.length] },
          u.body.token
        )
      )
    );

    assert(
      concurrentReactionResults.every((res) => res.status === 200),
      'All 10 concurrent reaction requests succeeded with 200 OK'
    );

    // Fetch the updated letter to verify all 10 reactions are intact and persisted
    const updatedLetter = await rawRequest('GET', `/api/letters/${validLetterId}`);
    assert(
      updatedLetter.body.reactions.length === 10,
      `Letter contains exactly 10 reactions without race conditions (persisted: ${updatedLetter.body.reactions.length})`
    );

    console.log('✅ Concurrency & Sanitization Tests Passed!\n');

    console.log('====================================================');
    console.log('🎉 ALL 22 SECURITY, BOUNDARY & CONCURRENCY TESTS PASSED 100%');
    console.log('====================================================');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Security Test Suite encountered an error:', err.message);
    if (server) server.close();
    process.exit(1);
  }
};

runSecurityAndEdgeTests();
