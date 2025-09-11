const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');

async function listLastMessages(req, res) {
	try {
		const myId = req.userId?.toString();
		if (!myId) {
			return res.status(400).json({ message: 'User ID is missing or invalid' });
		}

		const conversations = await Conversation.find({ participants: myId })
			.select('participants lastMessage')
			.lean();

		if (!conversations || conversations.length === 0) {
			return res.status(404).json({ message: 'No conversations found' });
		}

		const items = conversations.map((c) => {
			const otherId = c.participants.find((p) => p.toString() !== myId);
			if (!otherId) {
				console.error('Other participant ID is missing in conversation:', c);
			}
			return {
				otherUserId: otherId || null,
				lastMessage: c.lastMessage || null,
			};
		});

		return res.json({ items });
	} catch (err) {
		console.error('Error in listLastMessages:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

async function getMessages(req, res) {
	try {
		const otherUserId = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
			return res.status(400).json({ message: 'Invalid user id' });
		}
		const participants = [req.userId.toString(), otherUserId.toString()].sort();
		let conversation = await Conversation.findOne({ participants: { $all: participants } });
		if (!conversation) {
			return res.json({ messages: [] });
		}
		const limit = Math.min(Number(req.query.limit) || 50, 100);
		const before = req.query.before ? new Date(req.query.before) : null;
		const criteria = { conversation: conversation._id };
		if (before) criteria.createdAt = { $lt: before };

		const messages = await Message.find(criteria)
			.sort({ createdAt: -1 })
			.limit(limit)
			.lean();
		return res.json({ messages: messages.reverse() });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { getMessages, listLastMessages };
