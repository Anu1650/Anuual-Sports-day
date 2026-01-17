require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import routes
const otpRoutes = require('./routes/otp');
const participantRoutes = require('./routes/participants');
const adminRoutes = require('./routes/admin');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: [
    'http://localhost:5000',
    'https://aniket-ai.onrender.com'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   DATABASE CONNECTION
========================= */
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

/* =========================
   API ROUTES
========================= */
app.use('/api/otp', otpRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/admin', adminRoutes);

/* =========================
   PAGE ROUTES
========================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

/* =========================
   TEST & HEALTH ROUTES
========================= */
app.get('/api/test', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    services: {
      otp: 'active',
      participants: 'active',
      admin: 'active'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    email: process.env.EMAIL_USER ? 'configured' : 'not configured'
  });
});

/* =========================
   OTP DEBUG (OPTIONAL)
========================= */
app.get('/api/otp/debug', (req, res) => {
  try {
    const otpService = require('./services/otp-service');

    const debugInfo = {
      totalOtpCount: otpService.otpStore.size,
      otps: []
    };

    for (const [otpId, data] of otpService.otpStore) {
      debugInfo.otps.push({
        otpId,
        email: data.email,
        otp: data.otp,
        expiresIn: Math.max(0, data.expiryTime - Date.now()),
        verified: data.verified,
        action: data.data?.action || 'unknown'
      });
    }

    res.json({
      success: true,
      timestamp: new Date(),
      debugInfo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================
   FALLBACK (IMPORTANT)
========================= */
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📋 API Endpoints Ready');
});
