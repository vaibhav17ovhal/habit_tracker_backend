const express = require('express');
const protect = require('../middleware/auth');
const {
  getProfile,
  setupProfile,
  updateProfile,
} = require('../controllers/profileController');

const router = express.Router();

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.post('/setup', protect, setupProfile);

module.exports = router;
