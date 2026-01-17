require('dotenv').config();
const mongoose = require('mongoose');
const otpService = require('../services/otp-service');

const debugOTP = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25');
        console.log('✅ MongoDB connected');
        
        console.log('\n🔍 Checking OTP Service Status:');
        
        // Check OTP service instance
        console.log('1. OTP Service instance:', otpService ? 'Loaded' : 'Not loaded');
        console.log('2. OTP Store type:', typeof otpService.otpStore);
        console.log('3. OTP Store size:', otpService.otpStore ? otpService.otpStore.size : 'N/A');
        
        // List all stored OTPs
        if (otpService.otpStore && otpService.otpStore.size > 0) {
            console.log('\n📋 Stored OTPs:');
            let i = 1;
            for (const [otpId, data] of otpService.otpStore) {
                console.log(`${i}. OTP ID: ${otpId}`);
                console.log(`   Email: ${data.email}`);
                console.log(`   OTP: ${data.otp}`);
                console.log(`   Expires: ${new Date(data.expiryTime).toLocaleTimeString()}`);
                console.log(`   Verified: ${data.verified}`);
                console.log(`   Action: ${data.data?.action || 'N/A'}`);
                console.log('');
                i++;
            }
        } else {
            console.log('\n📭 No OTPs currently stored');
        }
        
        console.log('\n💡 Common OTP Verification Issues:');
        console.log('1. OTP ID mismatch between request and verification');
        console.log('2. OTP expiration (10 minutes)');
        console.log('3. Case sensitivity in email comparison');
        console.log('4. OTP service not persisting between requests');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
        process.exit(1);
    }
};

debugOTP();