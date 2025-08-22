const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMessages, listLastMessages } = require('../controllers/conversationController');

router.get('/:id/messages', auth, getMessages);
router.get('/last/messages', auth, listLastMessages);

module.exports = router;
