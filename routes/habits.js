const express = require('express');
const protect = require('../middleware/auth');
const {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  markHabitComplete,
  markHabitBroken,
  deleteHabit,
} = require('../controllers/habitController');

const router = express.Router();

router.use(protect);

router.route('/').get(getHabits).post(createHabit);
router.route('/:id').get(getHabit).put(updateHabit).delete(deleteHabit);
router.patch('/:id/complete', markHabitComplete);
router.patch('/:id/break', markHabitBroken);

module.exports = router;
