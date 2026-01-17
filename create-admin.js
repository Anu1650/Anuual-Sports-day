require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const createAdmin = async () => {
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Username: admin');
      console.log('To reset password, delete the admin from database and run this script again.');
      process.exit(0);
    }
    
    // Create admin user
    const admin = new Admin({
      username: 'admin',
      password: 'admin123',
      email: 'admin@sportsday2025.com',
      name: 'System Administrator',
      role: 'superadmin'
    });
    
    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('========================================');
    console.log('🔐 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('========================================');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();