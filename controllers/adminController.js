const Admin = require('../models/Admin');
const User = require('../models/User');
const { BRANCHES, SPORTS, addSport, addBranch } = require('../config/database');

const adminController = {
  // Get admin profile
  getProfile: async (req, res) => {
    try {
      const admin = await Admin.findById(req.session.admin.id)
        .select('-password -__v');
      
      if (!admin) {
        return res.status(404).json({ 
          success: false, 
          message: 'Admin not found' 
        });
      }
      
      res.json({
        success: true,
        data: admin
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch profile' 
      });
    }
  },

  // Update admin profile
  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
      
      const admin = await Admin.findByIdAndUpdate(
        req.session.admin.id,
        { name, email },
        { new: true, runValidators: true }
      ).select('-password -__v');
      
      if (!admin) {
        return res.status(404).json({ 
          success: false, 
          message: 'Admin not found' 
        });
      }
      
      // Update session
      req.session.admin.name = admin.name;
      req.session.admin.email = admin.email;
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: admin
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update profile' 
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const admin = await Admin.findById(req.session.admin.id);
      
      if (!admin) {
        return res.status(404).json({ 
          success: false, 
          message: 'Admin not found' 
        });
      }
      
      // Verify current password
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
      
      // Update password
      admin.password = newPassword;
      await admin.save();
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to change password' 
      });
    }
  },

  // Add new branch
  addBranch: async (req, res) => {
    try {
      const { branch } = req.body;
      
      if (!branch || branch.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Branch name is required' 
        });
      }
      
      const branchName = branch.trim().toUpperCase();
      
      if (addBranch(branchName)) {
        res.json({
          success: true,
          message: `Branch "${branchName}" added successfully`,
          data: { 
            branch: branchName,
            allBranches: BRANCHES 
          }
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: `Branch "${branchName}" already exists` 
        });
      }
    } catch (error) {
      console.error('Add branch error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add branch' 
      });
    }
  },

  // Add new sport
  addSport: async (req, res) => {
    try {
      const { sport } = req.body;
      
      if (!sport || sport.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Sport name is required' 
        });
      }
      
      const sportName = sport.trim();
      
      if (addSport(sportName)) {
        res.json({
          success: true,
          message: `Sport "${sportName}" added successfully`,
          data: { 
            sport: sportName,
            allSports: SPORTS 
          }
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: `Sport "${sportName}" already exists` 
        });
      }
    } catch (error) {
      console.error('Add sport error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add sport' 
      });
    }
  },

  // Get system configuration
  getConfig: async (req, res) => {
    try {
      // Get counts for each configuration
      const departmentCount = await User.distinct('department', { isActive: true });
      const sportsCount = await User.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$sports' },
        { $group: { _id: '$sports' } }
      ]);
      
      res.json({
        success: true,
        data: {
          branches: BRANCHES,
          sports: SPORTS,
          genders: ['Male', 'Female', 'Other'],
          years: ['1', '2', '3', '4'],
          stats: {
            branchesInUse: departmentCount.length,
            sportsInUse: sportsCount.length,
            totalBranches: BRANCHES.length,
            totalSports: SPORTS.length
          }
        }
      });
    } catch (error) {
      console.error('Get config error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch configuration' 
      });
    }
  },

  // Get dashboard data
  getDashboardData: async (req, res) => {
    try {
      const totalParticipants = await User.countDocuments({ isActive: true });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRegistrations = await User.countDocuments({
        isActive: true,
        registrationDate: { $gte: today }
      });
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayRegistrations = await User.countDocuments({
        isActive: true,
        registrationDate: { $gte: yesterday, $lt: today }
      });
      
      // Department with most registrations
      const topDepartment = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      
      // Most popular sport
      const topSport = await User.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$sports' },
        { $group: { _id: '$sports', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      
      // Recent registrations
      const recentRegistrations = await User.find({ isActive: true })
        .sort({ registrationDate: -1 })
        .limit(8)
        .select('name rollNo department sports registrationDate');
      
      // Gender distribution
      const genderDistribution = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]);
      
      // Year-wise distribution
      const yearDistribution = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      res.json({
        success: true,
        data: {
          totalParticipants,
          todayRegistrations,
          yesterdayRegistrations,
          growth: todayRegistrations - yesterdayRegistrations,
          topDepartment: topDepartment[0] || { _id: 'N/A', count: 0 },
          topSport: topSport[0] || { _id: 'N/A', count: 0 },
          recentRegistrations,
          genderDistribution,
          yearDistribution
        }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch dashboard data' 
      });
    }
  },

  // Bulk operations
  bulkDelete: async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No participants selected' 
        });
      }
      
      const result = await User.updateMany(
        { _id: { $in: ids }, isActive: true },
        { isActive: false }
      );
      
      res.json({
        success: true,
        message: `${result.modifiedCount} participants deleted successfully`,
        data: { deletedCount: result.modifiedCount }
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete participants' 
      });
    }
  }
};

module.exports = adminController;