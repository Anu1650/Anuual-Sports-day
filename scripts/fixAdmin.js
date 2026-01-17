require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const fixAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_day_2k25', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // First, drop the admins collection to remove old schema
        try {
            await mongoose.connection.db.dropCollection('admins');
            console.log('🗑️  Dropped admins collection to fix schema');
        } catch (e) {
            console.log('📋 Admins collection already dropped or does not exist');
        }
        
        // Define clean Admin schema without username issues
        const adminSchema = new mongoose.Schema({
            email: {
                type: String,
                required: true,
                unique: true,
                lowercase: true
            },
            password: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            role: {
                type: String,
                default: 'superadmin'
            },
            isActive: {
                type: Boolean,
                default: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        });
        
        // Hash password middleware
        adminSchema.pre('save', async function(next) {
            if (!this.isModified('password')) return next();
            try {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
                next();
            } catch (error) {
                next(error);
            }
        });
        
        // Compare password method
        adminSchema.methods.comparePassword = async function(candidatePassword) {
            return await bcrypt.compare(candidatePassword, this.password);
        };
        
        const Admin = mongoose.model('Admin', adminSchema);
        
        // Create admin with your email
        const admin = new Admin({
            email: 'aniketigade@gmail.com',
            password: 'Aniket123',
            name: 'Aniket Igade',
            role: 'superadmin'
        });
        
        await admin.save();
        
        console.log('\n✅ ADMIN CREATED SUCCESSFULLY!');
        console.log('========================================');
        console.log('📧 Email: aniketigade@gmail.com');
        console.log('🔑 Password: Aniket123');
        console.log('========================================');
        console.log('\n🚀 Login URL: http://localhost:5000/admin-login.html');
        
        // Create backup admin
        const admin2 = new Admin({
            email: 'admin@sportsday.com',
            password: 'Admin1234',
            name: 'Sports Day Admin',
            role: 'superadmin'
        });
        
        await admin2.save();
        
        console.log('\n✅ BACKUP ADMIN CREATED!');
        console.log('📧 Email: admin@sportsday.com');
        console.log('🔑 Password: Admin1234');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
};

fixAdmin();