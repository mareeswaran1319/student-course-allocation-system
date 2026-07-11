const express = require('express');
const router = express.Router();
const { login, changePassword, verifyAuth } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public
router.post('/login', login);

// Protected
router.put('/change-password', verifyToken, changePassword);
router.get('/verify', verifyToken, verifyAuth);

module.exports = router;
