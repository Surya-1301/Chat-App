require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { connectToDatabase } = require('./config/db');
const attachSocket = require('./socket'); // adapt if your socket exports differently

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

let corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
// In development, ensure local frontend dev server is allowed
if (process.env.NODE_ENV === 'development') {
  if (!corsOrigins.includes('http://localhost:3000')) corsOrigins.push('http://localhost:3000');
}
if (corsOrigins.length === 0) corsOrigins = ['*'];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// health
app.get('/', (req, res) => res.json({ name: 'Chat App API', status: 'ok' }));
app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// routes
const authRouter = require('./routes/auth');
// Debug: list registered auth router routes
try {
  const routes = (authRouter && authRouter.stack) ? authRouter.stack
    .filter((s) => s.route)
    .map((s) => ({ path: s.route.path, methods: Object.keys(s.route.methods) })) : [];
  console.log('Auth router routes:', routes);
} catch (e) {
  console.error('Failed to inspect auth router', e);
}
app.use('/auth', authRouter);
app.use('/users', require('./routes/users'));
app.use('/conversations', require('./routes/conversations'));

// route for opened-window: set Cross-Origin-Opener-Policy and serve the static html used by auth popups
app.get('/opened-window', (req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin'); // or 'same-origin-allow-popups' / remove header if not needed
  res.sendFile(__dirname + '/opened-window.html');
});

// global handlers
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Internal server error' });
});
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server listening: http://127.0.0.1:${PORT}`));

// Connect to MongoDB (don't crash in development — log and continue)
(async function initDbAndSockets() {
  try {
    console.log('Attempting to connect to DB:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('DB connected');
    if (typeof attachSocket === 'function') attachSocket(server, corsOrigins);
  } catch (err) {
    console.error('DB connect failed', err);
    if (process.env.NODE_ENV === 'development') {
      console.warn('Continuing without DB in development mode. Some features will be disabled.');
      if (typeof attachSocket === 'function') attachSocket(server, corsOrigins);
    } else {
      process.exit(1);
    }
  }
})();

// graceful
process.on('SIGTERM', () => server.close(() => process.exit(0)));

// User schema definition (moved here from user model file for completeness)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Keep index here
  // Remove any duplicate schema.index({ email: 1 }) elsewhere
});

// auth endpoints moved to /routes/auth.js
