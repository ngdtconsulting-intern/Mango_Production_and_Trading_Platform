import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'; // <-- ADD THIS
import User from './models/User.js';
import Survey from './models/Survey.js';
import MarketPrice from './models/MarketPrice.js';
import BuyingRequirement from './models/BuyingRequirement.js';
import Farm from './models/Farm.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });

    console.log('Connected to MongoDB');
    console.log('Clearing old data...');

    await User.deleteMany({});
    await Survey.deleteMany({});
    await MarketPrice.deleteMany({});
    await BuyingRequirement.deleteMany({});
    await Farm.deleteMany({});

    console.log('Old data cleared');

    // Hash passwords explicitly
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const farmerPassword = await bcrypt.hash('Farmer@123', 10);
    const traderPassword = await bcrypt.hash('Trader@123', 10);

    console.log('Creating users...');

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@mangofarm.com',
      phone: '9800000001',
      password: adminPassword,
      role: 'admin',
      verified: true,
      active: true,
      address: {
        ward: 1,
        tole: 'Municipality Office',
        district: 'Siraha',
        municipality: 'Lahan Municipality',
      },
    });

    const farmers = await User.create([
      {
        name: 'राम प्रसाद यादव',
        email: 'ram@farmer.com',
        phone: '9800000010',
        password: farmerPassword,
        role: 'farmer',
        verified: true,
        active: true,
        address: { ward: 3, tole: 'Paschim Tole', district: 'Siraha', municipality: 'Lahan Municipality' },
      },
      {
        name: 'सीता देवी महतो',
        email: 'sita@farmer.com',
        phone: '9800000011',
        password: farmerPassword,
        role: 'farmer',
        verified: true,
        active: true,
        address: { ward: 5, tole: 'Purba Tole', district: 'Siraha', municipality: 'Lahan Municipality' },
      }
    ]);

    const traders = await User.create([
      {
        name: 'राजेश शर्मा',
        email: 'rajesh@trader.com',
        phone: '9800000020',
        password: traderPassword,
        role: 'trader',
        verified: true,
        active: true,
        businessName: 'Sharma Fruits Trading',
        businessType: 'wholesaler',
        address: { ward: 1, tole: 'Bazaar Area', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan' },
      }
    ]);

    console.log(`Created: 1 admin, ${farmers.length} farmers, ${traders.length} traders`);
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();