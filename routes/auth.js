const express = require('express');
const protect = require('../middleware/auth');
const { signup, login, logout, deleteAccount } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
