const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
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
        match: [/^\d{10}$/, 'Phone number must be 10 digits']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['AIML', 'ENTC', 'CS', 'COMPUTER', 'Mechanical']
    },
    batch: {
        type: String,
        required: [true, 'Batch is required'],
        match: [/^\d{4}-\d{4}$/, 'Batch format: YYYY-YYYY']
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
        min: [1, 'Year must be between 1 and 4'],
        max: [4, 'Year must be between 1 and 4']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other']
    },
    sports: {
        type: [String],
        required: [true, 'At least one sport must be selected'],
        validate: {
            validator: function(sports) {
                return sports.length > 0;
            },
            message: 'At least one sport must be selected'
        }
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create index for faster searches
participantSchema.index({ rollNo: 1 });
participantSchema.index({ email: 1 });
participantSchema.index({ department: 1 });
participantSchema.index({ sports: 1 });

const Participant = mongoose.model('Participant', participantSchema);

module.exports = Participant;