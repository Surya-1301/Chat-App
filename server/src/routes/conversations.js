const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMessages } = require('../controllers/conversationController');

router.get('/:id/messages', auth, getMessages);

module.exports = router;
