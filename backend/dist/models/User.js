const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    match: [/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    maxlength: [254, 'Email cannot exceed 254 characters'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
	username: {
		type: String,
		required: false,
		unique: true,
		trim: true,
		lowercase: true,
		maxlength: [30, 'Username cannot exceed 30 characters'],
		match: [/^[a-z0-9._-]+$/, 'Username can only contain lowercase letters, numbers, dot, underscore or hyphen']
	},
  passwordHash: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [60, 'Invalid password hash'] // bcrypt hashes are always 60 chars
  },
  googleId: { type: String, index: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for better performance
UserSchema.index({ lastSeen: -1 });
UserSchema.index({ isOnline: 1 });
UserSchema.index({ status: 1 });

// Virtual for user's full profile URL
UserSchema.virtual('profileUrl').get(function() {
	return `/api/users/${this._id}`;
});

// Method to check if user is currently online
UserSchema.methods.isCurrentlyOnline = function() {
	if (!this.lastSeen) return false;
	const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
	return this.lastSeen > fiveMinutesAgo;
};

// Method to update last seen
UserSchema.methods.updateLastSeen = function() {
	this.lastSeen = new Date();
	return this.save();
};

// Method to set online status
UserSchema.methods.setOnlineStatus = function(status) {
	this.isOnline = status;
	if (status) {
		this.lastSeen = new Date();
	}
	return this.save();
};

// Pre-save middleware to ensure email is lowercase
UserSchema.pre('save', function(next) {
	if (this.email) {
		this.email = this.email.toLowerCase().trim();
	}
	if (this.name) {
		this.name = this.name.trim();
	}
	next();
});

// Pre-find middleware to ensure email is lowercase in queries
UserSchema.pre('find', function() {
	if (this._conditions.email) {
		this._conditions.email = this._conditions.email.toLowerCase().trim();
	}
});

UserSchema.pre('findOne', function() {
	if (this._conditions.email) {
		this._conditions.email = this._conditions.email.toLowerCase().trim();
	}
});

module.exports = mongoose.model('User', UserSchema);
