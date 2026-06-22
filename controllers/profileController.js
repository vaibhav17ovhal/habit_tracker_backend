const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { formatUser } = require('../utils/formatUser');

const uploadsDir = path.join(__dirname, '../uploads/avatars');

const saveAvatarFromBase64 = (userId, avatarData) => {
  if (!avatarData || typeof avatarData !== 'string') {
    return '';
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let base64 = avatarData.trim();
  let ext = 'jpg';

  const dataUrlMatch = base64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (dataUrlMatch) {
    ext = dataUrlMatch[1] === 'jpeg' ? 'jpg' : dataUrlMatch[1];
    base64 = dataUrlMatch[2];
  }

  const filename = `${userId}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));

  return `/uploads/avatars/${filename}`;
};

const validateUsername = async (username, userId) => {
  const normalizedUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
    return {
      error: 'Username must be 3-20 characters (letters, numbers, underscore)',
    };
  }

  const existingUsername = await User.findOne({
    username: normalizedUsername,
    _id: { $ne: userId },
  });

  if (existingUsername) {
    return { error: 'Username is already taken' };
  }

  return { value: normalizedUsername };
};

const applyProfileFields = async (user, body, { requireAvatar = false } = {}) => {
  const {
    name,
    email,
    avatar,
    username,
    dob,
    gender,
    primaryGoal,
    routinePreference,
    notificationsEnabled,
    reminderTime,
    theme,
    weeklyTarget,
    defaultCategories,
  } = body;

  if (name !== undefined && name.trim()) {
    user.name = name.trim();
  }

  if (email !== undefined && email.trim()) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingEmail) {
      const error = new Error('Email is already in use');
      error.statusCode = 409;
      throw error;
    }

    user.email = normalizedEmail;
  }

  if (username !== undefined && username.trim()) {
    const result = await validateUsername(username, user._id);
    if (result.error) {
      const error = new Error(result.error);
      error.statusCode = result.error.includes('taken') ? 409 : 400;
      throw error;
    }
    user.username = result.value;
  }

  if (avatar !== undefined && avatar.trim()) {
    user.avatar = saveAvatarFromBase64(user._id.toString(), avatar);
  } else if (requireAvatar && !user.avatar) {
    const error = new Error('Profile picture is required');
    error.statusCode = 400;
    throw error;
  }

  if (dob !== undefined) {
    if (!dob) {
      const error = new Error('Date of birth is required');
      error.statusCode = 400;
      throw error;
    }

    const parsedDob = new Date(dob);
    if (Number.isNaN(parsedDob.getTime())) {
      const error = new Error('Invalid date of birth');
      error.statusCode = 400;
      throw error;
    }
    user.dob = parsedDob;
  }

  if (gender !== undefined) {
    user.gender = gender?.trim() || '';
  }

  if (primaryGoal !== undefined) {
    user.primaryGoal = primaryGoal?.trim() || '';
  }

  if (
    routinePreference !== undefined ||
    notificationsEnabled !== undefined ||
    reminderTime !== undefined ||
    theme !== undefined
  ) {
    user.preferences = {
      routinePreference: ['morning', 'evening'].includes(routinePreference)
        ? routinePreference
        : user.preferences?.routinePreference || 'morning',
      notificationsEnabled:
        notificationsEnabled !== undefined
          ? notificationsEnabled !== false
          : user.preferences?.notificationsEnabled ?? true,
      reminderTime: reminderTime || user.preferences?.reminderTime || '08:00',
      theme: theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : user.preferences?.theme || 'light',
    };
  }

  if (weeklyTarget !== undefined || defaultCategories !== undefined) {
    user.habitTargets = {
      weeklyTarget:
        weeklyTarget !== undefined
          ? Math.min(21, Math.max(1, Number(weeklyTarget) || 5))
          : user.habitTargets?.weeklyTarget ?? 5,
      defaultCategories:
        defaultCategories !== undefined
          ? Array.isArray(defaultCategories)
            ? defaultCategories.filter((c) => typeof c === 'string')
            : []
          : user.habitTargets?.defaultCategories || [],
    };
  }
};

const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

const setupProfile = async (req, res) => {
  try {
    const { username, avatar, dob } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    if (!avatar || !avatar.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture is required',
      });
    }

    if (!dob) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth is required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await applyProfileFields(user, req.body, { requireAvatar: true });
    user.profileSetupComplete = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile setup completed successfully',
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Username or email is already taken',
      });
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to complete profile setup',
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await applyProfileFields(user, req.body);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Username or email is already taken',
      });
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update profile',
      error: error.message,
    });
  }
};

module.exports = { getProfile, setupProfile, updateProfile };
