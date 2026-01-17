require('dotenv').config();
const mongoose = require('mongoose');

const deleteAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Define Admin model
        const Admin = mongoose.model('Admin', new mongoose.Schema({
            email: String,
            password: String,
            name: String,
            role: String
        }));
        
        // Delete all admins
        const result = await Admin.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} admin(s)`);
        
        // Or delete specific email
        // const result = await Admin.deleteOne({ email: 'aniketigade@gmail.com' });
        // console.log(`🗑️ Deleted admin: ${result.deletedCount}`);
        
        console.log('✅ All admins deleted successfully!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

deleteAdmin();