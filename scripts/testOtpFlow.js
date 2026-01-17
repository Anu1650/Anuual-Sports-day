require('dotenv').config();
const mongoose = require('mongoose');
const otpService = require('../services/otp-service');
const emailService = require('../services/email-service');

const testOTPFlow = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25');
        console.log('✅ MongoDB connected');
        
        console.log('\n🧪 Testing OTP Flow...\n');
        
        // Test 1: Generate and store OTP
        console.log('1. 📝 Generating test OTP...');
        const testEmail = 'test@example.com';
        const testOtp = otpService.generateOTP();
        const otpId = otpService.storeOTP(testEmail, '1234567890', testOtp, {
            name: 'Test User',
            action: 'test'
        });
        
        console.log(`   OTP: ${testOtp}`);
        console.log(`   OTP ID: ${otpId}`);
        console.log(`   Email: ${testEmail}`);
        
        // Test 2: Verify correct OTP
        console.log('\n2. ✅ Testing correct OTP verification...');
        const correctResult = otpService.verifyOTP(otpId, testOtp);
        console.log(`   Result: ${correctResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Message: ${correctResult.message}`);
        
        // Test 3: Verify wrong OTP
        console.log('\n3. ❌ Testing wrong OTP verification...');
        const wrongResult = otpService.verifyOTP(otpId, '999999');
        console.log(`   Result: ${wrongResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Message: ${wrongResult.message}`);
        
        // Test 4: Check OTP store
        console.log('\n4. 📊 Checking OTP store...');
        console.log(`   Total OTPs in store: ${otpService.otpStore.size}`);
        
        if (otpService.otpStore.size > 0) {
            console.log('   Current OTPs:');
            for (const [id, data] of otpService.otpStore) {
                console.log(`     - ${id}: ${data.otp} for ${data.email}`);
            }
        }
        
        // Test 5: Test email service
        console.log('\n5. 📧 Testing email service...');
        try {
            const emailResult = await emailService.sendOTPEmail(
                testEmail,
                testOtp,
                'Test User',
                'test'
            );
            console.log(`   Result: ${emailResult.success ? 'SUCCESS' : 'FAILED'}`);
            console.log(`   Demo Mode: ${emailResult.demoMode ? 'YES' : 'NO'}`);
            if (emailResult.demoMode) {
                console.log(`   Demo Message: ${emailResult.message}`);
            }
        } catch (emailError) {
            console.log(`   Email Error: ${emailError.message}`);
        }
        
        console.log('\n🎉 OTP Flow Test Complete!');
        console.log('\n💡 If OTP verification is failing:');
        console.log('1. Check if OTP ID is being stored and passed correctly');
        console.log('2. Check server logs during OTP verification');
        console.log('3. Verify email case sensitivity');
        console.log('4. Check OTP expiration time');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

testOTPFlow();