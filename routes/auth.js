const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Admin login
router.post('/login', authController.adminLogin);

// Admin logout
router.post('/logout', authController.adminLogout);

// Check admin session
router.get('/check', authController.checkAdmin);

// Request registration OTP
router.post('/request-registration-otp', authController.requestRegistrationOTP);

// Verify registration OTP
router.post('/verify-registration-otp', authController.verifyRegistrationOTP);

// Request deletion OTP
router.post('/request-deletion-otp', authController.requestDeletionOTP);

// Verify deletion OTP
router.post('/verify-deletion-otp', authController.verifyDeletionOTP);

module.exports = router;