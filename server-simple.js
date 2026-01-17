require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Simple in-memory storage for OTPs
const otpStore = new Map();

// MongoDB connection (optional)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
    console.log('⚠️ MongoDB connection failed, using in-memory mode');
    console.log('💡 Error:', err.message);
});

console.log('🚀 Starting Sports Day Admin Server...');

// ======================
// SIMPLE ADMIN APIs
// ======================

// 1. Admin Login
app.post('/api/admin/login', (req, res) => {
    console.log('🔐 Admin login attempt:', req.body.email);
    
    const { email, password } = req.body;
    
    // Simple hardcoded admin for testing
    if (email === 'aniketigade@gmail.com' && password === 'Aniket123') {
        console.log('✅ Login successful');
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                name: 'Aniket Igade',
                email: email,
                role: 'superadmin',
                requiresOtp: true
            }
        });
    } else {
        console.log('❌ Login failed');
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// 2. Request OTP
app.post('/api/admin/request-login-otp', (req, res) => {
    console.log('📱 OTP request for:', req.body.email);
    
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = 'otp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Store OTP
    otpStore.set(otpId, {
        otp: otp,
        email: email,
        createdAt: new Date(),
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    
    console.log(`🔢 Generated OTP: ${otp} (ID: ${otpId})`);
    console.log(`📊 OTP store size: ${otpStore.size}`);
    
    res.json({
        success: true,
        message: 'OTP sent (check console)',
        otpId: otpId,
        emailResult: {
            demoMode: true,
            message: `Demo OTP for ${email}: ${otp}`
        },
        demoMode: true
    });
});

// 3. Verify OTP
app.post('/api/admin/verify-login-otp', (req, res) => {
    console.log('🔍 OTP verification request:', req.body);
    
    const { otpId, otp, email } = req.body;
    
    if (!otpId || !otp || !email) {
        return res.status(400).json({
            success: false,
            message: 'OTP ID, OTP, and email are required'
        });
    }
    
    // Get stored OTP
    const storedData = otpStore.get(otpId);
    
    if (!storedData) {
        console.log('❌ OTP not found or expired');
        return res.status(400).json({
            success: false,
            message: 'OTP expired or invalid'
        });
    }
    
    // Check expiration
    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(otpId);
        console.log('❌ OTP expired');
        return res.status(400).json({
            success: false,
            message: 'OTP expired'
        });
    }
    
    // Verify OTP
    if (storedData.otp !== otp) {
        console.log(`❌ OTP mismatch: Stored=${storedData.otp}, Received=${otp}`);
        return res.status(400).json({
            success: false,
            message: 'Invalid OTP'
        });
    }
    
    console.log('✅ OTP verified successfully');
    
    // Create session
    const sessionData = {
        id: 'admin-' + Date.now(),
        name: 'Aniket Igade',
        email: email,
        role: 'superadmin',
        isAuthenticated: true,
        sessionCreated: new Date().toISOString()
    };
    
    // Clean up OTP
    otpStore.delete(otpId);
    
    res.json({
        success: true,
        message: 'OTP verified successfully',
        data: sessionData
    });
});

// 4. Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            admin: 'active',
            otp: 'active',
            otpStoreSize: otpStore.size
        }
    });
});

// 5. Test endpoint
app.get('/api/admin/test', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is working!',
        timestamp: new Date().toISOString(),
        otpStoreSize: otpStore.size
    });
});

// 6. Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-panel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log(`========================================`);
    console.log(`🌐 Admin Login: http://localhost:${PORT}/admin-login.html`);
    console.log(`🌐 Registration: http://localhost:${PORT}/`);
    console.log(`🔧 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Admin API Test: http://localhost:${PORT}/api/admin/test`);
    console.log(`========================================`);
    console.log(`📋 TEST CREDENTIALS:`);
    console.log(`   Email: aniketigade@gmail.com`);
    console.log(`   Password: Aniket123`);
    console.log(`========================================`);
    console.log(`💡 OTP will appear in this console when requested`);
    console.log(`========================================`);
});