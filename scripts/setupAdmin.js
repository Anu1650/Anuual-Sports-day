require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const setupAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'aniketigade@gmail.com' });
        
        if (existingAdmin) {
            console.log('⚠️ Admin already exists');
            console.log('Email: aniketigade@gmail.com');
            
            // Show current admin info
            console.log('\n📋 Current Admin Info:');
            console.log(`Name: ${existingAdmin.name}`);
            console.log(`Role: ${existingAdmin.role}`);
            console.log(`Created: ${existingAdmin.createdAt}`);
            
            console.log('\n🔧 Options:');
            console.log('1. Delete existing admin and create new:');
            console.log('   mongo sports_day_2k25 --eval "db.admins.deleteOne({email:\'aniketigade@gmail.com\'})"');
            console.log('\n2. Update password directly in MongoDB:');
            console.log('   mongo sports_day_2k25');
            console.log('   db.admins.updateOne({email:"aniketigade@gmail.com"}, {$set:{password:"NewPassword123"}})');
            
            process.exit(0);
        }
        
        // Create default admin with proper password length
        const admin = new Admin({
            email: 'aniketigade@gmail.com',
            password: 'Aniket@123', // Changed to meet 6+ characters requirement
            name: 'Aniket Igade',
            role: 'superadmin'
        });
        
        await admin.save();
        
        console.log('✅ Admin created successfully!');
        console.log('========================================');
        console.log('Admin Credentials:');
        console.log('📧 Email: aniketigade@gmail.com');
        console.log('🔑 Password: Aniket@123');
        console.log('========================================');
        console.log('⚠️ IMPORTANT: Change password after first login!');
        console.log('\n🚀 Login URL: http://localhost:5000/admin-login.html');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error setting up admin:', error.message);
        
        if (error.message.includes('password')) {
            console.log('\n💡 Password must be at least 6 characters!');
        }
        
        process.exit(1);
    }
};

setupAdmin();