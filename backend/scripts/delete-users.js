// One-off safe script to delete all users from the database.
// Usage: node scripts/delete-users.js --confirm

const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const MONGO = process.env.MONGO_URI || process.env.MONGO || 'mongodb://localhost:27017/chat-app';

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.log('This will DELETE ALL USERS from the database.');
    console.log('To actually run it, re-run with the --confirm flag:');
    console.log('  node scripts/delete-users.js --confirm');
    process.exit(1);
  }

  console.log('Connecting to', MONGO);
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected. Deleting users...');
  const res = await User.deleteMany({});
  console.log('Deleted count:', res.deletedCount);
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
