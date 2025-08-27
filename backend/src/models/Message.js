const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
	{
		conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
		from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		content: { type: String, required: true },
		deliveredAt: { type: Date, default: null },
		readAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
