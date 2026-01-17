require('dotenv').config();
const mongoose = require('mongoose');

const removeIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25');
        console.log('✅ Connected to MongoDB');
        
        // Get the admins collection
        const collection = mongoose.connection.db.collection('admins');
        
        // List all indexes
        const indexes = await collection.indexes();
        console.log('\n📋 Current indexes:');
        indexes.forEach((index, i) => {
            console.log(`${i}. ${JSON.stringify(index.key)} - ${index.name}`);
        });
        
        // Find and remove username index
        const usernameIndex = indexes.find(index => index.key && index.key.username);
        if (usernameIndex) {
            console.log(`\n🗑️ Removing username index: ${usernameIndex.name}`);
            await collection.dropIndex(usernameIndex.name);
            console.log('✅ Username index removed');
        } else {
            console.log('\n✅ No username index found');
        }
        
        // Now create admin
        const Admin = mongoose.model('Admin', new mongoose.Schema({
            email: String,
            password: String,
            name: String,
            role: String
        }));
        
        // Delete existing admins
        await Admin.deleteMany({});
        console.log('🗑️  Cleared existing admins');
        
        // Hash password manually
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Aniket123', salt);
        
        // Create admin
        const admin = new Admin({
            email: 'aniketigade@gmail.com',
            password: hashedPassword,
            name: 'Aniket Igade',
            role: 'superadmin'
        });
        
        await admin.save();
        
        console.log('\n✅ ADMIN CREATED!');
        console.log('Email: aniketigade@gmail.com');
        console.log('Password: Aniket123');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

removeIndex();