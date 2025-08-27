require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { connectToDatabase } = require('./config/db');
const { attachSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

const corsOrigins = (process.env.CORS_ORIGINS || '*')
	.split(',')
	.map((s) => s.trim());

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check endpoints
app.get('/', (req, res) => res.json({ name: 'Chat App API', status: 'ok', version: '1.0.0' }));
app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// API routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/conversations', require('./routes/conversations'));

// Global error handler
app.use((err, req, res, next) => {
	console.error('Global error:', err);
	res.status(500).json({ message: 'Internal server error' });
});

// 404 handler (Express 5 compatible)
app.use((req, res) => {
	res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 4000;

connectToDatabase(process.env.MONGO_URI)
	.then(() => {
		attachSocket(server, corsOrigins);
		server.listen(PORT, () => {
			console.log(`🚀 Server running on http://localhost:${PORT}`);
			console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
		});
	})
	.catch((err) => {
		console.error('❌ Failed to connect to DB:', err);
		process.exit(1);
	});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully');
	server.close(() => {
		console.log('Process terminated');
	});
});
