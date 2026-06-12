const mongoose = require('mongoose');
const dotenv = require('dotenv');

const path = require('path');

// Load environment variables dynamically based on file location
dotenv.config({ path: path.join(__dirname, '.env') });

// Mongoose Models
const User = require('./models/User');
const Coupon = require('./models/Coupon');

const seedData = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/customwear');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing records
    await User.deleteMany({});
    await Coupon.deleteMany({});
    console.log('Database cleared of existing records.');

    // 1. Seed Accounts
    console.log('Seeding user profiles...');
    
    // Admin user
    const admin = new User({
      name: 'Tanhabir Rahman',
      email: 'admin@customwearbd.com',
      phone: '01999999999',
      password: 'adminpassword', // Will be hashed by pre-save hook
      role: 'admin',
      addresses: [{
        district: 'Dhaka',
        area: 'Banani',
        addressLine: 'House 45, Road 11',
        isDefault: true
      }]
    });
    await admin.save();

    // Standard Customer user
    const customer = new User({
      name: 'Siam Rahman',
      email: 'customer@email.com',
      phone: '01712345678',
      password: 'customerpassword', // Hashed
      role: 'customer',
      addresses: [{
        district: 'Dhaka',
        area: 'Dhanmondi',
        addressLine: 'House 14, Road 4',
        isDefault: true
      }]
    });
    await customer.save();

    console.log('Seeded User Accounts successfully:');
    console.log('Admin login: admin@customwearbd.com / adminpassword');
    console.log('Customer login: customer@email.com / customerpassword');

    // 2. Apparel Products seeding removed (managed via admin panel/db)
    console.log('Skipping apparel inventory seeding (relying on live database products)...');

    // 3. Seed Marketing Coupon Promo
    console.log('Seeding marketing coupon codes...');
    const promo = new Coupon({
      code: 'SUMMER30',
      discountType: 'percentage',
      discountValue: 30,
      minPurchase: 1000,
      maxDiscount: 1000, // max BDT 1000 discount
      expiryDate: new Date('2026-12-31'),
      isActive: true
    });
    await promo.save();
    console.log('Seeded coupon code: SUMMER30 successfully.');

    console.log('\n--- Seeding Process Finished Successfully! ---');
    mongoose.disconnect();
  } catch (error) {
    console.error('Database seeding failed with error:', error);
    process.exit(1);
  }
};

seedData();
