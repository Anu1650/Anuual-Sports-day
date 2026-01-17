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

// Middleware
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.log('❌ MongoDB connection error:', err);
  console.log('💡 Make sure MongoDB is running on port 27017');
});

// Routes
app.use('/api/otp', otpRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/admin', adminRoutes);
// Serve admin pages
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});


// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    services: {
        otp: 'active',
        participants: 'active',
        admin: 'active' // Add this
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    services: {
      otp: 'active',
      participants: 'active',
      email: process.env.EMAIL_USER ? 'configured' : 'not configured'
    }
  });
});

// Add this to your server.js or routes
app.get('/api/otp/debug', (req, res) => {
    try {
        const otpService = require('./services/otp-service');
        
        const debugInfo = {
            totalOtpCount: otpService.otpStore.size,
            otps: []
        };
        
        for (const [otpId, data] of otpService.otpStore) {
            debugInfo.otps.push({
                otpId: otpId,
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
            debugInfo: debugInfo
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log('\n📋 Available API endpoints:');
    console.log('   POST /api/admin/login');
    console.log('   POST /api/admin/request-login-otp');
    console.log('   POST /api/admin/verify-login-otp');
    console.log('   POST /api/admin/change-password');
    console.log('   POST /api/otp/request-registration-otp');
    console.log('   POST /api/otp/request-deletion-otp');
    console.log('   POST /api/otp/verify-otp');
    console.log('   POST /api/participants/register');
    console.log('   POST /api/participants/delete');
    console.log('   GET  /api/participants/all');
});