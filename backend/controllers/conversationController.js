const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');

async function listLastMessages(req, res) {
	try {
		console.log('[listLastMessages] req.userId:', req.userId);
		const myId = req.userId?.toString();
		if (!myId || !mongoose.Types.ObjectId.isValid(myId)) {
			console.error('[listLastMessages] Invalid myId:', myId);
			return res.status(400).json({ message: 'Invalid user id' });
		}
		const conversations = await Conversation.find({ participants: myId })
			.select('participants lastMessage')
			.lean();

		const items = conversations.map((c) => {
			const otherId = c.participants.find((p) => p.toString() !== myId);
			return {
				otherUserId: otherId,
				lastMessage: c.lastMessage || null,
			};
		});

		return res.json({ items });
	} catch (err) {
		console.error('[listLastMessages] Error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

async function getMessages(req, res) {
	try {
		console.log('[getMessages] req.userId:', req.userId, 'otherUserId:', req.params.id);
		const otherUserId = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
			console.error('[getMessages] Invalid otherUserId:', otherUserId);
			return res.status(400).json({ message: 'Invalid user id' });
		}
		const myId = req.userId?.toString();
		if (!myId || !mongoose.Types.ObjectId.isValid(myId)) {
			console.error('[getMessages] Invalid myId:', myId);
			return res.status(400).json({ message: 'Invalid user id' });
		}
		const participants = [myId, otherUserId.toString()].sort();
		let conversation = await Conversation.findOne({ participants: { $all: participants } });
		if (!conversation) {
			console.error('[getMessages] No conversation found for participants:', participants);
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
		console.error('[getMessages] Error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { getMessages, listLastMessages };
