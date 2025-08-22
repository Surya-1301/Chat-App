const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

async function register(req, res) {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Missing fields' });
		}
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ message: 'Email already in use' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, passwordHash });
		const token = signToken({ userId: user._id }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '7d');
		return res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email } });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
		const token = signToken({ userId: user._id }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '7d');
		return res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { register, login };
