// test-admin-password.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25');
        
        console.log('🔍 Checking admin in database...');
        
        // Find admin
        const admin = await mongoose.connection.db.collection('admins').findOne({ email: 'aniketigade@gmail.com' });
        
        if (!admin) {
            console.log('❌ No admin found!');
            process.exit(1);
        }
        
        console.log('\n📋 Admin found:');
        console.log(`Name: ${admin.name}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Password (first 20 chars): ${admin.password.substring(0, 20)}...`);
        console.log(`Password length: ${admin.password.length}`);
        
        // Check if password looks like bcrypt hash
        if (admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$') || admin.password.startsWith('$2y$')) {
            console.log('✅ Password appears to be bcrypt hashed');
            
            // Test password
            const testPassword = 'Aniket123';
            const isMatch = await bcrypt.compare(testPassword, admin.password);
            console.log(`🔑 Testing password "Aniket123": ${isMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH'}`);
            
            if (!isMatch) {
                console.log('\n🔧 Try these passwords:');
                console.log('- Aniket123');
                console.log('- Aniket@123');
                console.log('- aniket123');
                console.log('- Aniket');
            }
        } else {
            console.log('❌ Password is NOT hashed! It is plain text');
            console.log(`Actual password in DB: "${admin.password}"`);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();