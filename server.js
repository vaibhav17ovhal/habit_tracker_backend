require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const profileRoutes = require('./routes/profile');
const protect = require('./middleware/auth');
const { signup, login, logout, deleteAccount } = require('./controllers/authController');

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Habit Hero API running...');
});

app.use('/api/auth', authRoutes);
app.post('/signup', signup);
app.post('/login', login);
app.post('/logout', protect, logout);
app.delete('/delete-account', protect, deleteAccount);
app.use('/profile', profileRoutes);
app.use('/habits', habitRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Local (PC browser):     http://localhost:${PORT}`);
  console.log(`Flutter Android device: http://<your-pc-ipv4>:${PORT}`);
  console.log('  → Set ApiConfig.androidDevHost in Flutter to match ipconfig IPv4');
});
