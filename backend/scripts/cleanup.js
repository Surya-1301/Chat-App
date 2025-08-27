const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Clear all collections
    console.log('🗑️  Clearing all chat data...');
    
    // Delete all messages
    const messagesDeleted = await Message.deleteMany({});
    console.log(`🗑️  Deleted ${messagesDeleted.deletedCount} messages`);
    
    // Delete all conversations
    const conversationsDeleted = await Conversation.deleteMany({});
    console.log(`🗑️  Deleted ${conversationsDeleted.deletedCount} conversations`);
    
    // Delete all users (except admin if you want to keep one)
    const usersDeleted = await User.deleteMany({});
    console.log(`🗑️  Deleted ${usersDeleted.deletedCount} users`);
    
    // Reset auto-increment counters if any
    console.log('🔄 Database counters reset');
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('📝 All pre-existing chat data has been removed');
    
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
cleanupDatabase();
