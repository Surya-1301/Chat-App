const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/profile', require('../middleware/auth'), getProfile);
router.put('/profile', require('../middleware/auth'), updateProfile);

module.exports = router;
