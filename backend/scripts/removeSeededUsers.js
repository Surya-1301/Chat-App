const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User'); // adjust path/casing if needed

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app';

async function main() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB:', MONGO);

  const argv = process.argv.slice(2);
  const args = {};
  argv.forEach(a => {
    if (a.startsWith('--emails=')) args.emails = a.replace('--emails=', '').split(',').map(s => s.trim()).filter(Boolean);
    if (a.startsWith('--before=')) args.before = new Date(a.replace('--before=', '').trim());
    if (a === '--drop') args.drop = true;
    if (a === '--all') args.all = true;
  });

  if (args.drop) {
    await mongoose.connection.db.dropCollection('users').catch(err => {
      if (err.codeName === 'NamespaceNotFound') console.log('Collection users does not exist.');
      else throw err;
    });
    console.log('Dropped users collection.');
    return process.exit(0);
  }

  if (args.all) {
    const r = await User.deleteMany({});
    console.log(`Deleted ${r.deletedCount} users (all).`);
    return process.exit(0);
  }

  const filter = {};
  if (args.emails && args.emails.length) filter.email = { $in: args.emails };
  if (args.before) filter.createdAt = { $lt: args.before };

  if (!Object.keys(filter).length) {
    console.error('No filter provided. Use --emails=a@b.com,b@c.com OR --before=YYYY-MM-DD OR --drop OR --all');
    process.exit(1);
  }

  const res = await User.deleteMany(filter);
  console.log(`Deleted ${res.deletedCount} users matching filter:`, filter);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});