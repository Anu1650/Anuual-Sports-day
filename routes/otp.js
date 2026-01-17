const express = require('express');
const router = express.Router();
const otpService = require('../services/otp-service');
const emailService = require('../services/email-service');
const smsService = require('../services/sms-service');

// Request OTP for registration
router.post('/request-registration-otp', async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        // Validation
        if (!name || !email || !phone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and phone are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Validate phone format (Indian: 10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number must be 10 digits' 
            });
        }

        // Generate OTP
        const otp = otpService.generateOTP();
        console.log(`Generated OTP for ${email}: ${otp}`);

        // Store OTP with user data
        const otpId = otpService.storeOTP(email, phone, otp, { 
            name, 
            email, 
            phone, 
            action: 'registration' 
        });

        console.log(`Stored OTP with ID: ${otpId}`);

        // Send OTP via email
        const emailResult = await emailService.sendOTPEmail(email, otp, name, 'registration');
        
        // Send OTP via SMS (if configured)
        let smsResult = null;
        if (phone) {
            smsResult = await smsService.sendOTPSMS(phone, otp, 'registration');
        }

        res.json({
            success: true,
            message: 'OTP sent successfully',
            otpId: otpId,
            emailResult: emailResult,
            smsResult: smsResult,
            demoMode: emailResult.demoMode || smsResult?.demoMode
        });

    } catch (error) {
        console.error('❌ Error in OTP request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP. Please try again.' 
        });
    }
});

// Request OTP for deletion
router.post('/request-deletion-otp', async (req, res) => {
    try {
        const { rollNo, email, phone } = req.body;

        // Validation
        if (!rollNo || !email || !phone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Roll number, email, and phone are required' 
            });
        }

        // Generate OTP
        const otp = otpService.generateOTP();
        console.log(`Generated deletion OTP for ${email}: ${otp}`);

        // Store OTP with user data
        const otpId = otpService.storeOTP(email, phone, otp, { 
            rollNo, 
            email, 
            phone, 
            action: 'deletion' 
        });

        // Send OTP via email
        const emailResult = await emailService.sendOTPEmail(email, otp, 'User', 'deletion');
        
        // Send OTP via SMS (if configured)
        let smsResult = null;
        if (phone) {
            smsResult = await smsService.sendOTPSMS(phone, otp, 'deletion');
        }

        res.json({
            success: true,
            message: 'OTP sent successfully',
            otpId: otpId,
            emailResult: emailResult,
            smsResult: smsResult,
            demoMode: emailResult.demoMode || smsResult?.demoMode
        });

    } catch (error) {
        console.error('❌ Error in deletion OTP request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP. Please try again.' 
        });
    }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
    try {
        const { otpId, otp } = req.body;

        if (!otpId || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP ID and OTP are required' 
            });
        }

        console.log(`Verifying OTP: ID=${otpId}, OTP=${otp}`);

        // Verify OTP
        const result = otpService.verifyOTP(otpId, otp);

        if (!result.success) {
            console.log(`OTP verification failed: ${result.message}`);
            return res.status(400).json(result);
        }

        console.log(`OTP verification successful for ${result.data?.email}`);
        res.json(result);

    } catch (error) {
        console.error('❌ Error in OTP verification:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify OTP' 
        });
    }
});

module.exports = router;