const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    console.log('🚀 Starting admin seeder...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'admin@nayher.com',
      role: 'admin' 
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@naina.com',
      password: 'admin123456', // Will be hashed by the User model pre-save hook
      role: 'admin',
      phone: '+91-9876543210',
      address: {
        street: 'Headquarters',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      },
      isActive: true
    };

    const admin = await User.create(adminData);
    
    console.log('🎉 Admin user created successfully!');
    console.log('👤 Name:', admin.name);
    console.log('📧 Email:', admin.email);
    console.log('🔑 Role:', admin.role);
    console.log('🆔 ID:', admin._id);
    console.log('\n🔐 Login Credentials:');
    console.log('Email: admin@naina.com');
    console.log('Password: admin123456');
    console.log('\n🌐 Admin Panel: http://localhost:3001/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeder
seedAdmin();
