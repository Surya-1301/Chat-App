const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
	{
		participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
		lastMessage: {
			messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
			content: String,
			from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			createdAt: Date,
		},
	},
	{ timestamps: true }
);

ConversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
