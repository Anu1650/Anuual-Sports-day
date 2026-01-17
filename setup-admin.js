// fixed-setup-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const setupAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Check if admin already exists
        const existingAdmin = await mongoose.connection.db.collection('admins').findOne({ email: 'aniketigade@gmail.com' });
        
        if (existingAdmin) {
            console.log('⚠️ Admin already exists');
            console.log('Email: aniketigade@gmail.com');
            
            // Show current admin info
            console.log('\n📋 Current Admin Info:');
            console.log(`Name: ${existingAdmin.name}`);
            console.log(`Role: ${existingAdmin.role}`);
            console.log(`Created: ${existingAdmin.createdAt}`);
            
            console.log('\n🔧 Deleting and recreating admin with hashed password...');
            
            // Delete existing admin
            await mongoose.connection.db.collection('admins').deleteOne({ email: 'aniketigade@gmail.com' });
            console.log('✅ Deleted existing admin');
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Aniket123', salt);
        
        // Create default admin with HASHED password
        const admin = {
            email: 'aniketigade@gmail.com',
            password: hashedPassword,
            name: 'Aniket Igade',
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            loginAttempts: 0,
            isActive: true
        };
        
        // Insert directly into MongoDB
        await mongoose.connection.db.collection('admins').insertOne(admin);
        
        console.log('✅ Admin created successfully!');
        console.log('========================================');
        console.log('Admin Credentials:');
        console.log('📧 Email: aniketigade@gmail.com');
        console.log('🔑 Password: Aniket123');
        console.log('========================================');
        console.log('\n🚀 Login URL: http://localhost:5000/admin-login.html');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error setting up admin:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

setupAdmin();