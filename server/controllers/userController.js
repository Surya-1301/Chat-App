const User = require('../models/User');

async function listUsers(req, res) {
	try {
		const users = await User.find({ _id: { $ne: req.userId } })
			.select('_id name email lastSeen')
			.sort({ name: 1 });
		return res.json({ users });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { listUsers };
