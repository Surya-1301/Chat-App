const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const onlineUsers = new Map(); // userId -> Set(socketId)
const typingUsers = new Map(); // conversationId -> Set(userId)

function broadcastUserStatus(io, userId, status) {
	io.emit('user:status', { userId, status });
}

function broadcastTypingStatus(io, conversationId, userId, isTyping) {
	// Get all participants in the conversation
	Conversation.findById(conversationId)
		.then(conversation => {
			if (conversation) {
				conversation.participants.forEach(participantId => {
					if (participantId.toString() !== userId) {
						io.to(participantId.toString()).emit('typing:update', {
							conversationId,
							userId,
							isTyping
						});
					}
				});
			}
		})
		.catch(err => console.error('Error broadcasting typing status:', err));
}

function attachSocket(server, corsOrigins) {
	const { Server } = require('socket.io');
	const io = new Server(server, {
		cors: { origin: corsOrigins || '*', methods: ['GET', 'POST'] },
		pingTimeout: 60000,
		pingInterval: 25000,
		transports: ['websocket', 'polling'],
	});

	io.use((socket, next) => {
		try {
			const token = socket.handshake.auth?.token || socket.handshake.query?.token;
			if (!token) return next(new Error('Unauthorized'));

			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			socket.userId = decoded.id; // Use decoded.id as set in JWT
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
		socket.on('message:send', async ({ to, content, replyTo }, callback) => {
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
				
				const messageData = {
					conversation: conversation._id,
					from: userId,
					to,
					content: content.trim(),
					deliveredAt: new Date(),
				};

				// Add reply reference if provided
				if (replyTo) {
					messageData.replyTo = replyTo;
				}

				const message = await Message.create(messageData);

				conversation.lastMessage = {
					messageId: message._id,
					content: message.content,
					from: message.from,
					to: message.to,
					createdAt: message.createdAt,
				};
				await conversation.save();

				// Emit to all participants
				io.to(userId).to(to).emit('message:new', { message });
				
				// Stop typing indicator when message is sent
				if (typingUsers.has(conversation._id.toString())) {
					const typingSet = typingUsers.get(conversation._id.toString());
					typingSet.delete(userId);
					if (typingSet.size === 0) {
						typingUsers.delete(conversation._id.toString());
					}
					broadcastTypingStatus(io, conversation._id.toString(), userId, false);
				}

				callback && callback({ ok: true, message });
			} catch (err) {
				console.error('Message send error:', err);
				callback && callback({ ok: false, error: 'Server error' });
			}
		});

		// message:react - Add reactions to messages
		socket.on('message:react', async ({ messageId, reaction }, callback) => {
			try {
				if (!messageId || !reaction) {
					return callback && callback({ ok: false, error: 'Invalid payload' });
				}

				const message = await Message.findById(messageId);
				if (!message) {
					return callback && callback({ ok: false, error: 'Message not found' });
				}

				// Check if user is participant in the conversation
				const conversation = await Conversation.findById(message.conversation);
				if (!conversation || !conversation.participants.includes(userId)) {
					return callback && callback({ ok: false, error: 'Unauthorized' });
				}

				// Add or update reaction
				const reactionKey = `reactions.${userId}`;
				await Message.findByIdAndUpdate(messageId, {
					$set: { [reactionKey]: reaction }
				});

				// Broadcast reaction to all participants
				conversation.participants.forEach(participantId => {
					io.to(participantId.toString()).emit('message:reaction', {
						messageId,
						userId,
						reaction
					});
				});

				callback && callback({ ok: true });
			} catch (err) {
				console.error('Message reaction error:', err);
				callback && callback({ ok: false, error: 'Server error' });
			}
		});

		// typing:start - Enhanced typing indicator
		socket.on('typing:start', async ({ to }) => {
			try {
				if (!to || typeof to !== 'string') return;
				
				const participants = [userId, to].sort();
				const conversation = await Conversation.findOne({ participants: { $all: participants } });
				if (!conversation) return;

				const conversationId = conversation._id.toString();
				if (!typingUsers.has(conversationId)) {
					typingUsers.set(conversationId, new Set());
				}
				typingUsers.get(conversationId).add(userId);
				
				broadcastTypingStatus(io, conversationId, userId, true);
			} catch (err) {
				console.error('Typing start error:', err);
			}
		});
		
		// typing:stop - Enhanced typing indicator
		socket.on('typing:stop', async ({ to }) => {
			try {
				if (!to || typeof to !== 'string') return;
				
				const participants = [userId, to].sort();
				const conversation = await Conversation.findOne({ participants: { $all: participants } });
				if (!conversation) return;

				const conversationId = conversation._id.toString();
				if (typingUsers.has(conversationId)) {
					const typingSet = typingUsers.get(conversationId);
					typingSet.delete(userId);
					if (typingSet.size === 0) {
						typingUsers.delete(conversationId);
					}
					broadcastTypingStatus(io, conversationId, userId, false);
				}
			} catch (err) {
				console.error('Typing stop error:', err);
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

		// user:typing - Get current typing status for a conversation
		socket.on('user:typing', async ({ conversationId }) => {
			try {
				if (!conversationId) return;
				
				const conversation = await Conversation.findById(conversationId);
				if (!conversation || !conversation.participants.includes(userId)) return;

				const typingSet = typingUsers.get(conversationId);
				if (typingSet) {
					const typingUsersList = Array.from(typingSet).filter(id => id !== userId);
					socket.emit('typing:status', { conversationId, users: typingUsersList });
				}
			} catch (err) {
				console.error('User typing error:', err);
			}
		});

		socket.on('disconnect', async () => {
			console.log(`🔌 User ${userId} disconnected`);
			
			// Remove from typing indicators
			for (const [conversationId, typingSet] of typingUsers.entries()) {
				if (typingSet.has(userId)) {
					typingSet.delete(userId);
					if (typingSet.size === 0) {
						typingUsers.delete(conversationId);
					}
					broadcastTypingStatus(io, conversationId, userId, false);
				}
			}

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
