const User = require('../models/User');
const Admin = require('../models/Admin');
const crypto = require('crypto');

const authController = {
  // Admin login
  adminLogin: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find admin
      const admin = await Admin.findOne({ username, isActive: true });
      if (!admin) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
      
      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
      
      // Set session
      req.session.admin = {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role
      };
      
      res.json({ 
        success: true, 
        message: 'Login successful',
        admin: {
          username: admin.username,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error. Please try again.' 
      });
    }
  },

  // Admin logout
  adminLogout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Logout failed' 
        });
      }
      res.clearCookie('connect.sid');
      res.json({ 
        success: true, 
        message: 'Logout successful' 
      });
    });
  },

  // Check admin session
  checkAdmin: (req, res) => {
    if (req.session.admin) {
      res.json({ 
        success: true, 
        isAdmin: true,
        admin: req.session.admin 
      });
    } else {
      res.json({ 
        success: true, 
        isAdmin: false 
      });
    }
  },

  // Request OTP for registration
  requestRegistrationOTP: async (req, res) => {
    try {
      const { email, phone, rollNo } = req.body;
      
      // Check if email, phone or rollNo already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { phone }, { rollNo }] 
      });
      
      if (existingUser) {
        let message = '';
        if (existingUser.email === email) message = 'Email already registered';
        else if (existingUser.phone === phone) message = 'Phone number already registered';
        else if (existingUser.rollNo === rollNo) message = 'Roll number already registered';
        
        return res.status(400).json({ 
          success: false, 
          message 
        });
      }
      
      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store OTP in session
      req.session.registrationOTP = {
        email,
        phone,
        rollNo,
        otp,
        expiresAt: otpExpires
      };
      
      res.json({ 
        success: true, 
        message: 'OTP generated successfully',
        otp: otp // In production, you would send this via email/SMS
      });
    } catch (error) {
      console.error('OTP request error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate OTP' 
      });
    }
  },

  // Verify registration OTP
  verifyRegistrationOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      const sessionOTP = req.session.registrationOTP;
      
      if (!sessionOTP) {
        return res.status(400).json({ 
          success: false, 
          message: 'No OTP requested' 
        });
      }
      
      if (sessionOTP.email !== email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email mismatch' 
        });
      }
      
      if (new Date() > new Date(sessionOTP.expiresAt)) {
        delete req.session.registrationOTP;
        return res.status(400).json({ 
          success: false, 
          message: 'OTP has expired' 
        });
      }
      
      if (sessionOTP.otp !== otp) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid OTP' 
        });
      }
      
      // OTP verified successfully
      req.session.registrationVerified = {
        email: sessionOTP.email,
        phone: sessionOTP.phone,
        rollNo: sessionOTP.rollNo,
        verifiedAt: new Date()
      };
      
      delete req.session.registrationOTP;
      
      res.json({ 
        success: true, 
        message: 'OTP verified successfully'
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'OTP verification failed' 
      });
    }
  },

  // Request deletion OTP
  requestDeletionOTP: async (req, res) => {
    try {
      const { rollNo, email, phone } = req.body;
      
      // Find user
      const user = await User.findOne({ rollNo, email, phone, isActive: true });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'No active registration found with these details' 
        });
      }
      
      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      // Store OTP in user document
      user.otp = {
        code: otp,
        expiresAt: otpExpires,
        purpose: 'deletion'
      };
      
      await user.save();
      
      res.json({ 
        success: true, 
        message: 'Deletion OTP generated',
        otp: otp // In production, send via email/SMS
      });
    } catch (error) {
      console.error('Deletion OTP error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate deletion OTP' 
      });
    }
  },

  // Verify deletion OTP and delete account
  verifyDeletionOTP: async (req, res) => {
    try {
      const { rollNo, email, phone, otp } = req.body;
      
      // Find user
      const user = await User.findOne({ rollNo, email, phone, isActive: true });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'No active registration found' 
        });
      }
      
      // Check OTP
      if (!user.otp || !user.otp.code || user.otp.purpose !== 'deletion') {
        return res.status(400).json({ 
          success: false, 
          message: 'No valid deletion OTP requested' 
        });
      }
      
      if (new Date() > new Date(user.otp.expiresAt)) {
        user.otp = undefined;
        await user.save();
        return res.status(400).json({ 
          success: false, 
          message: 'OTP has expired' 
        });
      }
      
      if (user.otp.code !== otp) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid OTP' 
        });
      }
      
      // Delete user (soft delete)
      user.isActive = false;
      user.otp = undefined;
      await user.save();
      
      res.json({ 
        success: true, 
        message: 'Registration deleted successfully',
        data: {
          name: user.name,
          rollNo: user.rollNo
        }
      });
    } catch (error) {
      console.error('Deletion error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete registration' 
      });
    }
  }
};

module.exports = authController;