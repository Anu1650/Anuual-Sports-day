require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const resetAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Define Admin schema
        const adminSchema = new mongoose.Schema({
            email: String,
            password: String,
            name: String,
            role: String
        });
        
        const Admin = mongoose.model('Admin', adminSchema);
        
        // Delete all existing admins
        await Admin.deleteMany({});
        console.log('🗑️  Cleared existing admins');
        
        // Hash password for aniketigade@gmail.com
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Aniket123', salt);
        
        // Create admin with your email
        const admin = new Admin({
            email: 'aniketigade@gmail.com',
            password: hashedPassword,
            name: 'Aniket Igade',
            role: 'superadmin',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        await admin.save();
        
        console.log('\n✅ ADMIN CREATED SUCCESSFULLY!');
        console.log('========================================');
        console.log('📧 Email: aniketigade@gmail.com');
        console.log('🔑 Password: Aniket123');
        console.log('========================================');
        console.log('\n🚀 Login URL: http://localhost:5000/admin-login.html');
        
        // Also create backup admin
        const hashedPassword2 = await bcrypt.hash('Admin1234', salt);
        const admin2 = new Admin({
            email: 'admin@sportsday.com',
            password: hashedPassword2,
            name: 'Sports Day Admin',
            role: 'superadmin',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        await admin2.save();
        
        console.log('\n✅ BACKUP ADMIN CREATED!');
        console.log('📧 Email: admin@sportsday.com');
        console.log('🔑 Password: Admin1234');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

resetAdmin();