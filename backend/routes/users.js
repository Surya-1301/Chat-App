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
    const users = await User.find({}, { passwordHash: 0, password: 0 }).lean();
    const filtered = users.map(u => ({ id: String(u._id), name: u.name, email: u.email }))
                          .filter(u => currentId ? u.id !== String(currentId) : true);
    return res.json({ users: filtered });
  } catch (err) {
    console.error('GET /users error', err);
    return res.status(500).json({ message: 'Failed to load users' });
  }
});

module.exports = router;
