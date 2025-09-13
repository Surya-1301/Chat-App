
const mongoose = require('mongoose');

async function connectToDatabase(mongoUri) {
	if (!mongoUri) {
		throw new Error('MONGO_URI is not defined');
	}
	mongoose.set('strictQuery', true);
	try {
		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 10000,
			autoReconnect: true,
			maxIdleTimeMS: 60000,
			socketTimeoutMS: 45000,
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('MongoDB connected');
	} catch (err) {
		console.error('MongoDB connection error:', err);
		throw err;
	}

	mongoose.connection.on('disconnected', () => {
		console.warn('MongoDB disconnected! Attempting to reconnect...');
		connectToDatabase(mongoUri);
	});

	mongoose.connection.on('error', err => {
		console.error('MongoDB error:', err);
	});

	return mongoose.connection;
}

module.exports = { connectToDatabase };
