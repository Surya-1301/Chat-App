const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength validation
function validatePassword(password) {
	if (password.length < 6) {
		return { valid: false, message: 'Password must be at least 6 characters long' };
	}
	if (password.length > 128) {
		return { valid: false, message: 'Password must be less than 128 characters' };
	}
	return { valid: true };
}

// Email format validation
function validateEmail(email) {
	if (!EMAIL_REGEX.test(email)) {
		return { valid: false, message: 'Please enter a valid email address' };
	}
	if (email.length > 254) {
		return { valid: false, message: 'Email address is too long' };
	}
	return { valid: true };
}

// Name validation
function validateName(name) {
	if (name.length < 2) {
		return { valid: false, message: 'Name must be at least 2 characters long' };
	}
	if (name.length > 50) {
		return { valid: false, message: 'Name must be less than 50 characters' };
	}
	if (!/^[a-zA-Z\s'-]+$/.test(name)) {
		return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
	}
	return { valid: true };
}

async function register(req, res) {
	try {
		console.log('Incoming request data:', req.body);
		const { name, email, password } = req.body;

		// Check for missing fields
		if (!name || !email || !password) {
			return res.status(400).json({ 
				message: 'All fields are required',
				missing: {
					name: !name,
					email: !email,
					password: !password
				}
			});
		}

		// Validate input fields
		const nameValidation = validateName(name.trim());
		if (!nameValidation.valid) {
			return res.status(400).json({ message: nameValidation.message });
		}

		const emailValidation = validateEmail(email.trim().toLowerCase());
		if (!emailValidation.valid) {
			return res.status(400).json({ message: emailValidation.message });
		}

		const passwordValidation = validatePassword(password);
		if (!passwordValidation.valid) {
			return res.status(400).json({ message: passwordValidation.message });
		}

		// Check if email already exists
		const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
		if (existingUser) {
			return res.status(409).json({ 
				message: 'An account with this email already exists. Please login instead.' 
			});
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, 12); // Increased salt rounds for security

		// Create user
		const user = await User.create({
			name: name.trim(),
			email: email.trim().toLowerCase(),
			passwordHash
		});

		// Generate JWT token
		const token = signToken(
			{ userId: user._id }, 
			process.env.JWT_SECRET, 
			process.env.JWT_EXPIRES_IN || '7d'
		);

		// Return success response
		return res.status(201).json({
			message: 'Account created successfully!',
			token,
			user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				createdAt: user.createdAt
			}
		});

	} catch (err) {
		console.error('Registration error:', err);
		if (err.name === 'ValidationError') {
			return res.status(400).json({ message: 'Validation error', details: err.errors });
		}
		return res.status(500).json({ 
			message: 'Failed to create account. Please try again.',
			details: err.message 
		});
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body;

		// Check for missing fields
		if (!email || !password) {
			return res.status(400).json({ 
				message: 'Email and password are required',
				missing: {
					email: !email,
					password: !password
				}
			});
		}

		// Validate email format
		const emailValidation = validateEmail(email.trim().toLowerCase());
		if (!emailValidation.valid) {
			return res.status(400).json({ message: emailValidation.message });
		}

		// Find user by email
		const user = await User.findOne({ email: email.trim().toLowerCase() });
		if (!user) {
			return res.status(401).json({ 
				message: 'Invalid email or password. Please check your credentials and try again.' 
			});
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
		if (!isPasswordValid) {
			return res.status(401).json({ 
				message: 'Invalid email or password. Please check your credentials and try again.' 
			});
		}

		// Update last seen
		user.lastSeen = new Date();
		await user.save();

		// Generate JWT token
		const token = signToken(
			{ userId: user._id }, 
			process.env.JWT_SECRET, 
			process.env.JWT_EXPIRES_IN || '7d'
		);

		// Return success response
		return res.json({
			message: 'Login successful!',
			token,
			user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				lastSeen: user.lastSeen
			}
		});

	} catch (err) {
		console.error('Login error:', err);
		return res.status(500).json({ 
			message: 'Login failed. Please try again.' 
		});
	}
}

// Get current user profile
async function getProfile(req, res) {
	try {
		const user = await User.findById(req.userId).select('-passwordHash');
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.json({
			user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				lastSeen: user.lastSeen,
				createdAt: user.createdAt
			}
		});

	} catch (err) {
		console.error('Get profile error:', err);
		return res.status(500).json({ message: 'Failed to get profile' });
	}
}

// Update user profile
async function updateProfile(req, res) {
	try {
		const { name } = req.body;
		
		if (!name) {
			return res.status(400).json({ message: 'Name is required' });
		}

		const nameValidation = validateName(name.trim());
		if (!nameValidation.valid) {
			return res.status(400).json({ message: nameValidation.message });
		}

		const user = await User.findByIdAndUpdate(
			req.userId,
			{ name: name.trim() },
			{ new: true }
		).select('-passwordHash');

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.json({
			message: 'Profile updated successfully!',
			user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				lastSeen: user.lastSeen,
				createdAt: user.createdAt
			}
		});

	} catch (err) {
		console.error('Update profile error:', err);
		return res.status(500).json({ message: 'Failed to update profile' });
	}
}

module.exports = { 
	register, 
	login, 
	getProfile, 
	updateProfile 
};
