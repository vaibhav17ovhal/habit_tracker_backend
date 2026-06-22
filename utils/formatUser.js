const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  avatar: user.avatar || '',
  username: user.username || '',
  dob: user.dob ? user.dob.toISOString() : null,
  gender: user.gender || '',
  primaryGoal: user.primaryGoal || '',
  preferences: {
    routinePreference: user.preferences?.routinePreference || 'morning',
    notificationsEnabled: user.preferences?.notificationsEnabled ?? true,
    reminderTime: user.preferences?.reminderTime || '08:00',
    theme: user.preferences?.theme || 'light',
  },
  habitTargets: {
    weeklyTarget: user.habitTargets?.weeklyTarget ?? 5,
    defaultCategories: user.habitTargets?.defaultCategories || [],
  },
  profileSetupComplete: user.profileSetupComplete ?? false,
});

module.exports = { formatUser };
