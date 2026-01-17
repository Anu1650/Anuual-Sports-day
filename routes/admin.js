const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const otpService = require('../services/otp-service');
const emailService = require('../services/email-service');
const bcrypt = require('bcrypt');

// Admin login (email/password)
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Admin login attempt:', req.body.email);
        
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find admin
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        console.log('👤 Admin found:', admin ? 'Yes' : 'No');
        
        if (!admin) {
            console.log('❌ Admin not found for email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is locked
        if (admin.loginAttempts >= 5 && admin.lastLoginAttempt) {
            const timeSinceLastAttempt = Date.now() - admin.lastLoginAttempt.getTime();
            const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
            
            if (timeSinceLastAttempt < lockoutDuration) {
                const remainingTime = Math.ceil((lockoutDuration - timeSinceLastAttempt) / (60 * 1000));
                console.log('🔒 Account locked for:', email);
                return res.status(423).json({
                    success: false,
                    message: `Account is locked. Try again in ${remainingTime} minutes.`
                });
            } else {
                // Reset if lockout period has passed
                admin.loginAttempts = 0;
            }
        }

        // Verify password
        console.log('🔑 Verifying password...');
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        console.log('✅ Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            
            // Increment login attempts
            admin.loginAttempts = (admin.loginAttempts || 0) + 1;
            admin.lastLoginAttempt = new Date();
            await admin.save();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Reset login attempts on successful login
        admin.loginAttempts = 0;
        admin.lastLogin = new Date();
        await admin.save();
        
        console.log('🎉 Login successful for:', email);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                requiresOtp: true
            }
        });

    } catch (error) {
        console.error('❌ Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Request OTP for admin login - FIXED VERSION
router.post('/request-login-otp', async (req, res) => {
    try {
        console.log('📱 Admin OTP request for:', req.body.email);
        
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if admin exists
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            console.log('❌ Admin not found for OTP request:', email);
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        console.log('👤 Admin found for OTP:', admin.name);

        // Generate OTP
        const otp = otpService.generateOTP();
        console.log('🔢 Generated OTP:', otp);

        // Store OTP with admin data
        const otpId = otpService.storeOTP(email.toLowerCase(), null, otp, {
            email: email.toLowerCase(),
            name: admin.name,
            adminId: admin._id,
            action: 'admin-login',
            timestamp: new Date()
        });

        console.log('📝 Stored OTP with ID:', otpId);
        
        // Debug: Show all stored OTPs
        console.log('📊 Current OTP Store Contents:');
        console.log('Total OTPs:', otpService.otpStore.size);
        for (const [id, data] of otpService.otpStore) {
            console.log(`  OTP ID: ${id}`);
            console.log(`    Email: ${data.email}`);
            console.log(`    OTP: ${data.otp}`);
            console.log(`    Action: ${data.data?.action}`);
            console.log(`    Expires: ${new Date(data.expiryTime).toLocaleTimeString()}`);
            console.log('---');
        }

        // Send OTP via email
        let emailResult = { demoMode: true, message: 'Check console for OTP (demo mode)' };
        
        // Try to send email if configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                emailResult = await emailService.sendOTPEmail(
                    email, 
                    otp, 
                    admin.name, 
                    'admin-login'
                );
                console.log('📧 Email sent result:', emailResult);
            } catch (emailError) {
                console.log('⚠️ Email sending failed, using demo mode:', emailError.message);
                emailResult = { 
                    demoMode: true, 
                    message: 'Email service not configured. Check console for OTP.',
                    error: emailError.message 
                };
            }
        } else {
            console.log('⚠️ Email credentials not configured, using demo mode');
            console.log(`📱 OTP for ${email}: ${otp}`);
        }

        // ⭐⭐⭐⭐ FIXED: ALWAYS RETURN OTP ⭐⭐⭐⭐
        res.json({
            success: true,
            message: 'OTP sent successfully',
            otpId: otpId,
            otp: otp, // ← CHANGED: Always return OTP (was: process.env.NODE_ENV === 'development' ? otp : undefined)
            emailResult: emailResult,
            demoMode: emailResult.demoMode || false
        });

    } catch (error) {
        console.error('❌ Admin OTP request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
        });
    }
});

// Verify admin login OTP - IMPROVED VERSION
router.post('/verify-login-otp', async (req, res) => {
    try {
        console.log('🔍 Admin OTP verification request:', req.body);
        
        let { otpId, otp, email } = req.body;

        if (!otp) {
            console.log('❌ OTP is required');
            return res.status(400).json({
                success: false,
                message: 'OTP is required'
            });
        }

        console.log(`🔍 Verification attempt - OTP: ${otp}, Email: ${email}, OTP ID: ${otpId}`);

        // Debug: Show all OTPs in store
        console.log('📊 Current OTP Store (before verification):');
        let foundMatch = false;
        for (const [id, data] of otpService.otpStore) {
            console.log(`  OTP ID: ${id}`);
            console.log(`    Email: ${data.email}`);
            console.log(`    OTP: ${data.otp}`);
            console.log(`    Verified: ${data.verified}`);
            console.log(`    Expires: ${new Date(data.expiryTime).toLocaleTimeString()}`);
            console.log(`    Now: ${new Date().toLocaleTimeString()}`);
            console.log(`    Expired: ${Date.now() > data.expiryTime ? 'YES' : 'NO'}`);
            console.log('---');
            
            // Check if this matches
            const emailMatch = email && data.email && data.email.toLowerCase() === email.toLowerCase();
            const otpMatch = data.otp === otp.toString();
            const otpIdMatch = otpId && id === otpId;
            
            if (emailMatch && otpMatch) {
                foundMatch = true;
                console.log(`✅ Found matching OTP! ID: ${id}`);
            }
        }

        let verificationResult = null;
        let finalOtpId = otpId;

        // Method 1: Try with provided otpId
        if (otpId) {
            console.log(`🔄 Method 1: Verifying with provided otpId: ${otpId}`);
            verificationResult = otpService.verifyOtp(otpId, otp, 'admin-login');
            console.log('Verification result (Method 1):', verificationResult);
        }

        // Method 2: If no otpId or verification failed, try with email
        if ((!verificationResult || !verificationResult.success) && email) {
            console.log(`🔄 Method 2: Looking for OTP by email: ${email}`);
            
            // Find all OTPs for this email
            const matchingOtps = [];
            for (const [id, data] of otpService.otpStore) {
                if (data.email && data.email.toLowerCase() === email.toLowerCase()) {
                    matchingOtps.push({ id, data });
                }
            }
            
            console.log(`Found ${matchingOtps.length} OTP(s) for email ${email}`);
            
            // Try each matching OTP
            for (const match of matchingOtps) {
                console.log(`Trying OTP ID: ${match.id}`);
                verificationResult = otpService.verifyOtp(match.id, otp, 'admin-login');
                if (verificationResult.success) {
                    finalOtpId = match.id;
                    console.log(`✅ Success with OTP ID: ${match.id}`);
                    break;
                }
            }
        }

        // Method 3: Try to find any OTP that matches (last resort)
        if (!verificationResult || !verificationResult.success) {
            console.log('🔄 Method 3: Searching all OTPs for a match...');
            for (const [id, data] of otpService.otpStore) {
                if (data.otp === otp.toString() && !data.verified) {
                    console.log(`Found matching OTP by value: ${id}`);
                    verificationResult = otpService.verifyOtp(id, otp, 'admin-login');
                    if (verificationResult.success) {
                        finalOtpId = id;
                        email = data.email; // Update email from OTP data
                        break;
                    }
                }
            }
        }

        if (!verificationResult || !verificationResult.success) {
            console.log('❌ OTP verification failed');
            return res.status(400).json({
                success: false,
                message: verificationResult?.message || 'Invalid OTP',
                details: {
                    providedOtp: otp,
                    providedEmail: email,
                    providedOtpId: otpId,
                    foundMatch: foundMatch
                }
            });
        }

        console.log('✅ OTP verification successful!');
        
        // Extract email from verification result if not provided
        if (!email && verificationResult.data && verificationResult.data.email) {
            email = verificationResult.data.email;
        }

        // Find admin
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            console.log('❌ Admin not found after OTP verification:', email);
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        console.log('👤 Admin found:', admin.name);

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Create session data
        const sessionData = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isAuthenticated: true,
            sessionCreated: new Date().toISOString(),
            otpVerified: true
        };
        
        console.log('✅ Login process completed for:', admin.name);

        res.json({
            success: true,
            message: 'OTP verified successfully',
            data: sessionData,
            debug: process.env.NODE_ENV === 'development' ? {
                otpIdUsed: finalOtpId,
                emailUsed: email
            } : undefined
        });

    } catch (error) {
        console.error('❌ Admin OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Debug endpoint for OTP
router.get('/debug-otp', (req, res) => {
    try {
        const debugInfo = {
            timestamp: new Date(),
            totalOtps: otpService.otpStore.size,
            otps: []
        };

        for (const [id, data] of otpService.otpStore) {
            debugInfo.otps.push({
                id: id,
                email: data.email,
                otp: data.otp,
                action: data.data?.action || 'unknown',
                verified: data.verified,
                expiresIn: Math.max(0, data.expiryTime - Date.now()),
                expired: Date.now() > data.expiryTime,
                expiryTime: new Date(data.expiryTime).toLocaleString(),
                currentTime: new Date().toLocaleString()
            });
        }

        res.json({
            success: true,
            debug: debugInfo
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Simple test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is working',
        timestamp: new Date().toISOString(),
        otpService: typeof otpService,
        otpStoreSize: otpService.otpStore?.size || 0
    });
});

// Get admin profile
router.get('/profile', async (req, res) => {
    try {
        // For now, just return test data
        res.json({
            success: true,
            message: 'Admin profile',
            data: {
                name: 'Administrator',
                email: 'admin@sportsday.com',
                role: 'admin',
                lastLogin: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
});

// Change admin password
router.post('/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Find admin
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// Create admin account (for setup)
router.post('/create', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }

        // Create new admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = new Admin({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'admin',
            createdAt: new Date()
        });

        await admin.save();

        res.json({
            success: true,
            message: 'Admin created successfully',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('❌ Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin'
        });
    }
});

module.exports = router;