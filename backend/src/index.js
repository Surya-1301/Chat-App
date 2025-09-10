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

const corsOrigins = (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// health
app.get('/', (req, res) => res.json({ name: 'Chat App API', status: 'ok' }));
app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// routes
app.use('/auth', require('./routes/auth'));
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
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening: http://127.0.0.1:${PORT}`));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('DB connected');
    // attachSocket should accept the http server or create io(server)
    if (typeof attachSocket === 'function') attachSocket(server, corsOrigins);
  })
  .catch(err => {
    console.error('DB connect failed', err);
    process.exit(1);
  });

// graceful
process.on('SIGTERM', () => server.close(() => process.exit(0)));

// User schema definition (moved here from user model file for completeness)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Keep index here
  // Remove any duplicate schema.index({ email: 1 }) elsewhere
});

// Register route handler
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route handler
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!password || !user.password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
