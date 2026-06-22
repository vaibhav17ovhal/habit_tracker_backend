const mongoose = require('mongoose');
const Habit = require('../models/Habit');

const todayKey = () => new Date().toISOString().slice(0, 10);

const findUserHabit = async (habitId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(habitId)) {
    return null;
  }

  return Habit.findOne({ _id: habitId, user: userId });
};

const formatHabit = (habit) => ({
  id: habit._id.toString(),
  user: habit.user,
  title: habit.title,
  type: habit.type,
  frequency: habit.frequency,
  reminders: habit.reminders,
  streak: habit.streak,
  completedDates: habit.completedDates,
  brokenDates: habit.brokenDates,
  createdAt: habit.createdAt,
  updatedAt: habit.updatedAt,
});

const createHabit = async (req, res) => {
  try {
    const { title, type, frequency, reminders } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title and type are required',
      });
    }

    if (!['good', 'bad'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be good or bad',
      });
    }

    if (frequency && !['daily', 'weekly', 'custom'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Frequency must be daily, weekly, or custom',
      });
    }

    const habit = await Habit.create({
      user: req.user._id,
      title,
      type,
      frequency: frequency || 'daily',
      reminders: reminders || [],
    });

    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      habit: formatHabit(habit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create habit',
      error: error.message,
    });
  }
};

const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: habits.length,
      habits: habits.map(formatHabit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch habits',
      error: error.message,
    });
  }
};

const getHabit = async (req, res) => {
  try {
    const habit = await findUserHabit(req.params.id, req.user._id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    res.status(200).json({
      success: true,
      habit: formatHabit(habit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch habit',
      error: error.message,
    });
  }
};

const markHabitComplete = async (req, res) => {
  try {
    const habit = await findUserHabit(req.params.id, req.user._id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    const date = todayKey();

    if (habit.completedDates.includes(date)) {
      return res.status(400).json({
        success: false,
        message: 'Habit already marked complete for today',
      });
    }

    habit.completedDates.push(date);
    habit.brokenDates = habit.brokenDates.filter((d) => d !== date);
    habit.streak += 1;

    await habit.save();

    res.status(200).json({
      success: true,
      message: 'Habit marked as complete',
      habit: formatHabit(habit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark habit complete',
      error: error.message,
    });
  }
};

const markHabitBroken = async (req, res) => {
  try {
    const habit = await findUserHabit(req.params.id, req.user._id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    const date = todayKey();

    if (habit.brokenDates.includes(date)) {
      return res.status(400).json({
        success: false,
        message: 'Habit already marked broken for today',
      });
    }

    habit.brokenDates.push(date);
    habit.completedDates = habit.completedDates.filter((d) => d !== date);
    habit.streak = 0;

    await habit.save();

    res.status(200).json({
      success: true,
      message: 'Habit marked as broken',
      habit: formatHabit(habit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark habit broken',
      error: error.message,
    });
  }
};

const updateHabit = async (req, res) => {
  try {
    const habit = await findUserHabit(req.params.id, req.user._id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    const { title, type, frequency, reminders } = req.body;

    if (title !== undefined) {
      const trimmedTitle = String(title).trim();
      if (!trimmedTitle) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty',
        });
      }
      habit.title = trimmedTitle;
    }

    if (type !== undefined) {
      if (!['good', 'bad'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be good or bad',
        });
      }
      habit.type = type;
    }

    if (frequency !== undefined) {
      if (!['daily', 'weekly', 'custom'].includes(frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Frequency must be daily, weekly, or custom',
        });
      }
      habit.frequency = frequency;
    }

    if (reminders !== undefined) {
      if (!Array.isArray(reminders)) {
        return res.status(400).json({
          success: false,
          message: 'Reminders must be an array',
        });
      }
      habit.reminders = reminders;
    }

    await habit.save();

    res.status(200).json({
      success: true,
      message: 'Habit updated successfully',
      habit: formatHabit(habit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update habit',
      error: error.message,
    });
  }
};

const deleteHabit = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Habit deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete habit',
      error: error.message,
    });
  }
};

module.exports = {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  markHabitComplete,
  markHabitBroken,
  deleteHabit,
};
