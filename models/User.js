const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      default: '',
    },
    primaryGoal: {
      type: String,
      default: '',
    },
    preferences: {
      routinePreference: {
        type: String,
        enum: ['morning', 'evening'],
        default: 'morning',
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      reminderTime: {
        type: String,
        default: '08:00',
      },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
    },
    habitTargets: {
      weeklyTarget: {
        type: Number,
        default: 5,
        min: 1,
        max: 21,
      },
      defaultCategories: {
        type: [String],
        default: [],
      },
    },
    profileSetupComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
