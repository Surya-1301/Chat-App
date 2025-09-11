const express = require('express');
const router = express.Router();
const User = require('../models/User'); // adjust casing to match file
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'devsecret';

// simple auth helper (optional — adapt to your real middleware)
function getUserIdFromHeader(req) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  try {
    const payload = jwt.verify(m[1], SECRET);
    return payload?.id ?? null;
  } catch (e) {
    return null;
  }
}

router.get('/', async (req, res) => {
  try {
    const currentId = getUserIdFromHeader(req);
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const search = q
      ? { $or: [ { name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { username: new RegExp(q, 'i') } ] }
      : {};
    const users = await User.find(search, { passwordHash: 0 }).lean();
    const filtered = users
      .filter(u => currentId ? String(u._id) !== String(currentId) : true)
      .map(u => ({ _id: String(u._id), name: u.name, email: u.email, username: u.username, isOnline: !!u.isOnline, lastSeen: u.lastSeen }));
    return res.json({ users: filtered });
  } catch (err) {
    console.error('GET /users error', err);
    return res.status(500).json({ message: 'Failed to load users' });
  }
});

module.exports = router;
