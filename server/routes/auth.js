const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const User = require('../models/User'); // ensure filename matches (User.js vs user.js)
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'devsecret';

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const hash = user.passwordHash ?? user.password ?? '';
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: String(user._id), email: user.email }, SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } });
  } catch (err) {
    console.error('Auth login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = jwt.sign({ id: String(user._id), email: user.email }, SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } });
  } catch (err) {
    console.error('Auth register error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /auth/google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ message: 'idToken required' });

    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: 'Invalid Google token' });

    const email = payload.email;
    const name = payload.name || '';
    const googleId = payload.sub;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId }); // ensure schema allows googleId
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = jwt.sign({ id: String(user._id), email: user.email }, SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } });
  } catch (err) {
    console.error('Auth /google error', err);
    return res.status(500).json({ message: 'Google auth failed' });
  }
});

module.exports = router;
