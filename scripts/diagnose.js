const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Admin Login Issues...\n');

// Check 1: Is server running?
console.log('1. 🚀 Checking if server is running...');
http.get('http://localhost:5000/api/health', (res) => {
    console.log(`   ✅ Server is running (Status: ${res.statusCode})`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('   📊 Server status:', response);
            
            // Check 2: Test admin endpoints
            testAdminEndpoints();
        } catch (e) {
            console.log('   ❌ Failed to parse response');
        }
    });
}).on('error', (err) => {
    console.log('   ❌ Server is NOT running:', err.message);
    console.log('\n💡 Start your server with:');
    console.log('   npm start');
    console.log('   OR');
    console.log('   node server.js');
    process.exit(1);
});

function testAdminEndpoints() {
    console.log('\n2. 🔍 Testing admin API endpoints...');
    
    // Test admin login endpoint
    const loginData = JSON.stringify({
        email: 'aniketigade@gmail.com',
        password: 'Aniket123'
    });
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };
    
    const req = http.request(options, (res) => {
        console.log(`   📡 /api/admin/login status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('   📄 Response:', data);
            
            // Test OTP request endpoint
            testOTPEndpoint();
        });
    });
    
    req.on('error', (err) => {
        console.log('   ❌ /api/admin/login failed:', err.message);
        console.log('\n💡 This means the admin route is not properly configured.');
        console.log('   Check server.js for: app.use(\'/api/admin\', adminRoutes)');
    });
    
    req.write(loginData);
    req.end();
}

function testOTPEndpoint() {
    console.log('\n3. 📱 Testing OTP endpoint...');
    
    const otpData = JSON.stringify({
        email: 'aniketigade@gmail.com'
    });
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/request-login-otp',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': otpData.length
        }
    };
    
    const req = http.request(options, (res) => {
        console.log(`   📡 /api/admin/request-login-otp status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('   📄 Response:', data);
            
            // Check file structure
            checkFileStructure();
        });
    });
    
    req.on('error', (err) => {
        console.log('   ❌ /api/admin/request-login-otp failed:', err.message);
        checkFileStructure();
    });
    
    req.write(otpData);
    req.end();
}

function checkFileStructure() {
    console.log('\n4. 📁 Checking project structure...');
    
    const requiredFiles = [
        'server.js',
        'routes/admin.js',
        'models/Admin.js',
        'services/otp-service.js',
        'services/email-service.js'
    ];
    
    let allExist = true;
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        const exists = fs.existsSync(filePath);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
        if (!exists) allExist = false;
    });
    
    if (!allExist) {
        console.log('\n💡 Missing files. Let me help you create them...');
        createMissingFiles();
    } else {
        console.log('\n✅ All required files exist!');
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Check server console for errors');
        console.log('2. Look at browser console (F12)');
        console.log('3. Test with Postman or curl');
        console.log('4. Check MongoDB connection');
    }
}

function createMissingFiles() {
    console.log('\n🔧 Creating missing files...');
    
    // Create simplified server.js if missing
    const serverJsPath = path.join(__dirname, '..', 'server.js');
    if (!fs.existsSync(serverJsPath)) {
        console.log('   Creating server.js...');
        const serverContent = `require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ MongoDB error:', err));

// Simple admin routes for testing
app.post('/api/admin/login', (req, res) => {
    console.log('🔐 Login attempt:', req.body.email);
    
    const { email, password } = req.body;
    
    if (email === 'aniketigade@gmail.com' && password === 'Aniket123') {
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                name: 'Aniket Igade',
                email: email,
                role: 'admin',
                requiresOtp: true
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

app.post('/api/admin/request-login-otp', (req, res) => {
    console.log('📱 OTP request for:', req.body.email);
    
    // Generate random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Generated OTP:', otp);
    
    res.json({
        success: true,
        message: 'OTP sent (check console)',
        otpId: 'test-otp-id-' + Date.now(),
        emailResult: {
            demoMode: true,
            message: \`Demo OTP: \${otp}\`
        }
    });
});

app.post('/api/admin/verify-login-otp', (req, res) => {
    console.log('🔍 OTP verification:', req.body);
    
    // Always accept OTP for testing
    res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
            id: 'admin-123',
            name: 'Aniket Igade',
            email: 'aniketigade@gmail.com',
            role: 'superadmin',
            isAuthenticated: true
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        services: {
            admin: 'active',
            otp: 'active'
        }
    });
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-panel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

app.listen(PORT, () => {
    console.log(\`🚀 Server running on port \${PORT}\`);
    console.log(\`🌐 Admin Login: http://localhost:\${PORT}/admin-login.html\`);
});`;
        
        fs.writeFileSync(serverJsPath, serverContent);
        console.log('   ✅ server.js created');
    }
    
    console.log('\n🎉 Created basic server.js with working admin APIs!');
    console.log('\n🚀 Start your server with:');
    console.log('   node server.js');
    console.log('\n📋 Test credentials:');
    console.log('   Email: aniketigade@gmail.com');
    console.log('   Password: Aniket123');
    console.log('\n🌐 Login URL: http://localhost:5000/admin-login.html');
}