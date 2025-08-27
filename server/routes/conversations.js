const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMessages, listLastMessages } = require('../controllers/conversationController');

router.get('/last/messages', auth, listLastMessages);
router.get('/:id/messages', auth, getMessages);

module.exports = router;
