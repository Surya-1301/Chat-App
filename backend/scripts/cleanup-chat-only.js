const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

async function cleanupChatDataOnly() {
  try {
    console.log('🧹 Starting chat data cleanup...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Clear only chat-related collections
    console.log('🗑️  Clearing chat data only...');
    
    // Delete all messages
    const messagesDeleted = await Message.deleteMany({});
    console.log(`🗑️  Deleted ${messagesDeleted.deletedCount} messages`);
    
    // Delete all conversations
    const conversationsDeleted = await Conversation.deleteMany({});
    console.log(`🗑️  Deleted ${conversationsDeleted.deletedCount} conversations`);
    
    // Keep user accounts intact
    console.log('👥 User accounts preserved');
    
    console.log('✅ Chat data cleanup completed successfully!');
    console.log('📝 All pre-existing conversations and messages have been removed');
    console.log('👤 User accounts remain intact');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run cleanup
cleanupChatDataOnly();
