const mongoose = require('mongoose');
const { BRANCHES, SPORTS, GENDERS, YEARS } = require('../config/database');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Please enter a valid 10-digit phone number'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: BRANCHES
  },
  batch: {
    type: String,
    required: [true, 'Batch is required'],
    trim: true
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: YEARS
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: GENDERS
  },
  sports: [{
    type: String,
    required: [true, 'At least one sport is required'],
    validate: {
      validator: function(v) {
        return v.every(sport => SPORTS.includes(sport));
      },
      message: 'Invalid sports selected'
    }
  }],
  registrationDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  otp: {
    code: String,
    expiresAt: Date,
    purpose: String
  }
});

// Indexes for faster queries
userSchema.index({ rollNo: 1 });
userSchema.index({ department: 1 });
userSchema.index({ gender: 1 });
userSchema.index({ sports: 1 });
userSchema.index({ batch: 1 });
userSchema.index({ year: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;