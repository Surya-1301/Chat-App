const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const onlineUsers = new Map(); // userId -> Set(socketId)

function broadcastUserStatus(io, userId, status) {
	io.emit('user:status', { userId, status });
}

function attachSocket(server, corsOrigins) {
	const { Server } = require('socket.io');
	const io = new Server(server, {
		cors: { origin: corsOrigins || '*', methods: ['GET', 'POST'] },
		pingTimeout: 60000,
		pingInterval: 25000,
	});

	io.use((socket, next) => {
		try {
			const token = socket.handshake.auth?.token || socket.handshake.query?.token;
			if (!token) return next(new Error('Unauthorized'));
			
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			socket.userId = decoded.userId;
			return next();
		} catch (err) {
			console.error('Socket auth error:', err.message);
			return next(new Error('Unauthorized'));
		}
	});

	io.on('connection', async (socket) => {
		const userId = socket.userId.toString();
		console.log(`🔌 User ${userId} connected`);
		
		socket.join(userId);
		if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
		onlineUsers.get(userId).add(socket.id);
		broadcastUserStatus(io, userId, 'online');

		// message:send
		socket.on('message:send', async ({ to, content }, callback) => {
			try {
				if (!to || !content || typeof content !== 'string') {
					return callback && callback({ ok: false, error: 'Invalid payload' });
				}
				
				if (content.length > 1000) {
					return callback && callback({ ok: false, error: 'Message too long' });
				}

				const participants = [userId, to].sort();
				let conversation = await Conversation.findOne({ participants: { $all: participants } });
				if (!conversation) {
					conversation = await Conversation.create({ participants });
				}
				
				const message = await Message.create({
					conversation: conversation._id,
					from: userId,
					to,
					content: content.trim(),
					deliveredAt: new Date(),
				});

				conversation.lastMessage = {
					messageId: message._id,
					content: message.content,
					from: message.from,
					to: message.to,
					createdAt: message.createdAt,
				};
				await conversation.save();

				io.to(userId).to(to).emit('message:new', { message });
				callback && callback({ ok: true, message });
			} catch (err) {
				console.error('Message send error:', err);
				callback && callback({ ok: false, error: 'Server error' });
			}
		});

		// typing indicators
		socket.on('typing:start', ({ to }) => {
			if (to && typeof to === 'string') {
				io.to(to).emit('typing:start', { from: userId });
			}
		});
		
		socket.on('typing:stop', ({ to }) => {
			if (to && typeof to === 'string') {
				io.to(to).emit('typing:stop', { from: userId });
			}
		});

		// message:read
		socket.on('message:read', async ({ from }) => {
			try {
				if (!from || typeof from !== 'string') return;
				
				const participants = [userId, from].sort();
				const conversation = await Conversation.findOne({ participants: { $all: participants } });
				if (!conversation) return;
				
				await Message.updateMany(
					{ conversation: conversation._id, to: userId, readAt: null }, 
					{ $set: { readAt: new Date() } }
				);
				io.to(from).emit('message:read', { by: userId });
			} catch (err) {
				console.error('Message read error:', err);
			}
		});

		socket.on('disconnect', async () => {
			console.log(`🔌 User ${userId} disconnected`);
			const set = onlineUsers.get(userId);
			if (set) {
				set.delete(socket.id);
				if (set.size === 0) {
					onlineUsers.delete(userId);
					try {
						await User.findByIdAndUpdate(userId, { $set: { lastSeen: new Date() } });
						broadcastUserStatus(io, userId, 'offline');
					} catch (err) {
						console.error('Error updating user last seen:', err);
					}
				}
			}
		});

		socket.on('error', (error) => {
			console.error('Socket error:', error);
		});
	});

	return io;
}

module.exports = { attachSocket };
