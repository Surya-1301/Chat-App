require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../src/config/db');
const User = require('../src/models/User');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

(async () => {
	try {
		await connectToDatabase(process.env.MONGO_URI);

		const usersData = [
			{ name: 'Alice', email: 'alice@example.com', password: 'password123' },
			{ name: 'Bob', email: 'bob@example.com', password: 'password123' },
			{ name: 'Charlie', email: 'charlie@example.com', password: 'password123' },
		];

		// Upsert users with hashed passwords
		const createdUsers = {};
		for (const u of usersData) {
			const passwordHash = await bcrypt.hash(u.password, 10);
			const user = await User.findOneAndUpdate(
				{ email: u.email },
				{ $set: { name: u.name, email: u.email, passwordHash } },
				{ upsert: true, new: true }
			);
			createdUsers[u.email] = user;
		}

		const alice = createdUsers['alice@example.com'];
		const bob = createdUsers['bob@example.com'];

		const participants = [alice._id.toString(), bob._id.toString()].sort();
		let conversation = await Conversation.findOne({ participants: { $all: participants } });
		if (!conversation) {
			conversation = await Conversation.create({ participants });
		} else {
			await Message.deleteMany({ conversation: conversation._id });
		}

		const now = Date.now();
		const messages = await Message.insertMany([
			{ conversation: conversation._id, from: alice._id, to: bob._id, content: 'Hey Bob! 👋', createdAt: new Date(now - 5 * 60 * 1000), updatedAt: new Date(now - 5 * 60 * 1000), deliveredAt: new Date(now - 5 * 60 * 1000), readAt: new Date(now - 4 * 60 * 1000) },
			{ conversation: conversation._id, from: bob._id, to: alice._id, content: 'Hi Alice! How are you?', createdAt: new Date(now - 4 * 60 * 1000), updatedAt: new Date(now - 4 * 60 * 1000), deliveredAt: new Date(now - 4 * 60 * 1000), readAt: new Date(now - 3 * 60 * 1000) },
			{ conversation: conversation._id, from: alice._id, to: bob._id, content: "I'm good, thanks! Working on the chat app.", createdAt: new Date(now - 3 * 60 * 1000), updatedAt: new Date(now - 3 * 60 * 1000), deliveredAt: new Date(now - 3 * 60 * 1000), readAt: new Date(now - 2 * 60 * 1000) },
			{ conversation: conversation._id, from: bob._id, to: alice._id, content: 'Nice! Need any help?', createdAt: new Date(now - 2 * 60 * 1000), updatedAt: new Date(now - 2 * 60 * 1000), deliveredAt: new Date(now - 2 * 60 * 1000), readAt: new Date(now - 1 * 60 * 1000) },
			{ conversation: conversation._id, from: alice._id, to: bob._id, content: "Maybe later. Let's test read receipts.", createdAt: new Date(now - 1 * 60 * 1000), updatedAt: new Date(now - 1 * 60 * 1000), deliveredAt: new Date(now - 1 * 60 * 1000), readAt: null },
		]);

		const last = messages[messages.length - 1];
		conversation.lastMessage = {
			messageId: last._id,
			content: last.content,
			from: last.from,
			to: last.to,
			createdAt: last.createdAt,
		};
		await conversation.save();

		console.log('Seed complete. Users:');
		for (const u of usersData) {
			console.log(`- ${u.name}: ${u.email} / ${u.password}`);
		}
		console.log('Conversation created between Alice and Bob with 5 messages.');
		await mongoose.disconnect();
		process.exit(0);
	} catch (err) {
		console.error('Seed failed', err);
		process.exit(1);
	}
})();
