require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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

// login route
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Return token and user object
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// register route
app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Return token and user object
    res.json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// global handlers
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Internal server error' });
});
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

connectToDatabase(process.env.MONGO_URI)
  .then(() => {
    // attachSocket should accept the http server or create io(server)
    if (typeof attachSocket === 'function') attachSocket(server, corsOrigins);
    server.listen(PORT, () => {
      console.log(`Server listening: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB connect failed', err);
    process.exit(1);
  });

// graceful
process.on('SIGTERM', () => server.close(() => process.exit(0)));
