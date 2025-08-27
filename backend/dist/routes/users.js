const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listUsers } = require('../controllers/userController');

router.get('/', auth, listUsers);

module.exports = router;
