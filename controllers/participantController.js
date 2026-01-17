const User = require('../models/User');
const { BRANCHES, SPORTS, GENDERS, YEARS } = require('../config/database');

const participantController = {
  // Register new participant
  register: async (req, res) => {
    try {
      // Check if OTP was verified
      if (!req.session.registrationVerified || 
          !req.session.registrationVerified.email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please verify your email with OTP first' 
        });
      }
      
      const { 
        name, rollNo, phone, email, 
        department, batch, year, gender, sports 
      } = req.body;
      
      // Verify session data matches form data
      if (email !== req.session.registrationVerified.email ||
          phone !== req.session.registrationVerified.phone ||
          rollNo !== req.session.registrationVerified.rollNo) {
        return res.status(400).json({ 
          success: false, 
          message: 'Data mismatch. Please restart registration.' 
        });
      }
      
      // Validate department
      if (!BRANCHES.includes(department)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid department selected' 
        });
      }
      
      // Validate sports
      if (!Array.isArray(sports) || sports.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please select at least one sport' 
        });
      }
      
      const invalidSports = sports.filter(sport => !SPORTS.includes(sport));
      if (invalidSports.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid sports selected: ${invalidSports.join(', ')}` 
        });
      }
      
      // Create new user
      const user = new User({
        name,
        rollNo,
        phone,
        email,
        department,
        batch,
        year,
        gender,
        sports
      });
      
      await user.save();
      
      // Clear session
      delete req.session.registrationVerified;
      
      res.status(201).json({ 
        success: true, 
        message: 'Registration successful!',
        data: {
          id: user._id,
          name: user.name,
          rollNo: user.rollNo,
          department: user.department,
          sports: user.sports,
          registrationDate: user.registrationDate
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ 
          success: false, 
          message: `${field} already exists in our system` 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Registration failed. Please try again.' 
      });
    }
  },

  // Get all participants with filters and sorting
  getAllParticipants: async (req, res) => {
    try {
      const { 
        department, 
        gender, 
        sport, 
        batch, 
        year, 
        search,
        sortBy = 'rollNo',
        sortOrder = 'asc'
      } = req.query;
      
      // Build query
      let query = { isActive: true };
      
      if (department && department !== 'all') {
        query.department = department;
      }
      
      if (gender && gender !== 'all') {
        query.gender = gender;
      }
      
      if (sport && sport !== 'all') {
        query.sports = sport;
      }
      
      if (batch && batch !== 'all') {
        query.batch = batch;
      }
      
      if (year && year !== 'all') {
        query.year = year;
      }
      
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { rollNo: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { department: searchRegex }
        ];
      }
      
      // Build sort
      const sort = {};
      const validSortFields = ['name', 'rollNo', 'department', 'batch', 'year', 'gender', 'registrationDate'];
      const field = validSortFields.includes(sortBy) ? sortBy : 'rollNo';
      sort[field] = sortOrder === 'desc' ? -1 : 1;
      
      // Get participants
      const participants = await User.find(query)
        .sort(sort)
        .select('-otp -__v -isActive');
      
      // Get distinct values for filters
      const departments = await User.distinct('department', { isActive: true });
      const genders = await User.distinct('gender', { isActive: true });
      const sportsList = await User.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$sports' },
        { $group: { _id: '$sports' } },
        { $sort: { _id: 1 } }
      ]);
      const batches = await User.distinct('batch', { isActive: true });
      const years = await User.distinct('year', { isActive: true });
      
      res.json({
        success: true,
        count: participants.length,
        data: participants,
        filters: {
          departments: departments.sort(),
          genders: genders.sort(),
          sports: sportsList.map(s => s._id).sort(),
          batches: batches.sort(),
          years: years.sort()
        }
      });
    } catch (error) {
      console.error('Get participants error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch participants' 
      });
    }
  },

  // Delete participant (admin)
  deleteParticipant: async (req, res) => {
    try {
      const { id } = req.params;
      
      const participant = await User.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
      
      if (!participant) {
        return res.status(404).json({ 
          success: false, 
          message: 'Participant not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Participant deleted successfully',
        data: {
          name: participant.name,
          rollNo: participant.rollNo
        }
      });
    } catch (error) {
      console.error('Delete participant error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete participant' 
      });
    }
  },

  // Get statistics
  getStatistics: async (req, res) => {
    try {
      const total = await User.countDocuments({ isActive: true });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRegistrations = await User.countDocuments({
        isActive: true,
        registrationDate: { $gte: today }
      });
      
      // Department-wise count
      const departmentStats = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Gender-wise count
      const genderStats = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Sport-wise count
      const sportStats = await User.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$sports' },
        { $group: { _id: '$sports', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Year-wise count
      const yearStats = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      res.json({
        success: true,
        data: {
          total,
          todayRegistrations,
          departmentStats,
          genderStats,
          sportStats,
          yearStats
        }
      });
    } catch (error) {
      console.error('Statistics error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch statistics' 
      });
    }
  }
};

module.exports = participantController;