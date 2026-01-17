const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');

// Register a new participant
router.post('/register', async (req, res) => {
    try {
        const { 
            name, 
            rollNo, 
            phone, 
            email, 
            department, 
            batch, 
            year, 
            gender, 
            sports 
        } = req.body;

        console.log('📝 Registration attempt for:', email);

        // Check if participant already exists
        const existingParticipant = await Participant.findOne({ 
            $or: [{ rollNo: rollNo.toUpperCase() }, { email: email.toLowerCase() }] 
        });

        if (existingParticipant) {
            let message = '';
            if (existingParticipant.rollNo === rollNo.toUpperCase()) {
                message = 'This roll number is already registered';
            } else {
                message = 'This email is already registered';
            }
            
            console.log('⚠️ Registration failed - duplicate:', message);
            
            return res.status(400).json({
                success: false,
                message: message
            });
        }

        // Create new participant
        const participant = new Participant({
            name,
            rollNo: rollNo.toUpperCase(),
            phone,
            email: email.toLowerCase(),
            department,
            batch,
            year: parseInt(year),
            gender,
            sports,
            registrationDate: new Date()
        });

        await participant.save();

        console.log('✅ Registration successful for:', email);

        res.json({
            success: true,
            message: 'Registration successful!',
            data: {
                id: participant._id,
                name: participant.name,
                rollNo: participant.rollNo,
                department: participant.department,
                sports: participant.sports
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error.message);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// Delete participant by roll number
router.post('/delete', async (req, res) => {
    try {
        const { rollNo } = req.body;

        if (!rollNo) {
            return res.status(400).json({
                success: false,
                message: 'Roll number is required'
            });
        }

        console.log('🗑️ Deletion attempt for roll number:', rollNo);

        const deletedParticipant = await Participant.findOneAndDelete({ 
            rollNo: rollNo.toUpperCase() 
        });

        if (!deletedParticipant) {
            console.log('⚠️ Deletion failed - not found:', rollNo);
            return res.status(404).json({
                success: false,
                message: 'No registration found with this roll number'
            });
        }

        console.log('✅ Deletion successful for:', deletedParticipant.email);

        res.json({
            success: true,
            message: 'Registration deleted successfully',
            data: {
                name: deletedParticipant.name,
                rollNo: deletedParticipant.rollNo
            }
        });

    } catch (error) {
        console.error('❌ Deletion error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete registration'
        });
    }
});

// Get all participants
router.get('/all', async (req, res) => {
    try {
        const participants = await Participant.find()
            .sort({ registrationDate: -1 })
            .select('-__v');

        console.log(`📊 Fetched ${participants.length} participants`);

        res.json({
            success: true,
            count: participants.length,
            data: participants
        });

    } catch (error) {
        console.error('❌ Error fetching participants:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch participants'
        });
    }
});

// Search participants
router.get('/search', async (req, res) => {
    try {
        const { query, department, sport, gender } = req.query;
        
        let searchFilter = {};
        
        // Text search
        if (query) {
            searchFilter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { rollNo: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }
        
        // Department filter
        if (department) {
            searchFilter.department = department;
        }
        
        // Sport filter
        if (sport) {
            searchFilter.sports = sport;
        }
        
        // Gender filter
        if (gender) {
            searchFilter.gender = gender;
        }
        
        const participants = await Participant.find(searchFilter)
            .sort({ name: 1 })
            .select('-__v');

        res.json({
            success: true,
            count: participants.length,
            data: participants
        });

    } catch (error) {
        console.error('❌ Search error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

// Get participant by roll number
router.get('/:rollNo', async (req, res) => {
    try {
        const participant = await Participant.findOne({ 
            rollNo: req.params.rollNo.toUpperCase() 
        }).select('-__v');

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        res.json({
            success: true,
            data: participant
        });

    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch participant'
        });
    }
});

module.exports = router;