const mongoose = require('mongoose');
const dotenv = require('dotenv');

const path = require('path');

// Load environment variables dynamically based on file location
dotenv.config({ path: path.join(__dirname, '.env') });

// Mongoose Models
const User = require('./models/User');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');

const seedData = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/customwear');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing records
    await User.deleteMany({});
    await Product.deleteMany({});
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

    // 2. Seed Apparel Products
    console.log('Seeding apparel inventory...');
    const items = [
      {
        name: 'Summer Breathable Solid Cotton T-Shirt',
        category: 'T-shirt',
        price: 750,
        discountPrice: 490,
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop'],
        stock: 120,
        variants: {
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: ['#000000', '#ffffff', '#ff0000', '#0000ff']
        },
        description: 'Engineered with 100% premium combed organic cotton (180+ GSM), this crew-neck T-shirt offers unmatched comfort and shape retention. Pre-shrunk fabric to prevent sizing variations.',
        ratings: { average: 4.8, count: 24 }
      },
      {
        name: 'Classic Crimson Polo Shirt',
        category: 'Polo',
        price: 1250,
        discountPrice: 950,
        images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop'],
        stock: 12,
        variants: {
          sizes: ['S', 'M', 'L', 'XL'],
          colors: ['#ff0000', '#000000', '#ffffff']
        },
        description: 'Double pique knit polo shirt featuring a classic 2-button placket and ribbed knit sleeve cuffs. Comfortable, lightweight, and perfect for smart-casual wear.',
        ratings: { average: 4.5, count: 8 }
      },
      {
        name: 'Oxford Casual Navy Blue Shirt',
        category: 'Shirt',
        price: 1850,
        discountPrice: 1450,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop'],
        stock: 15,
        variants: {
          sizes: ['M', 'L', 'XL'],
          colors: ['#1e3a8a', '#ffffff']
        },
        description: 'Premium Oxford cotton shirt tailored for active everyday wear. Features button-down collar details, curved cuffs, and breathability suited for tropical climates.',
        ratings: { average: 4.6, count: 15 }
      },
      {
        name: 'Royal Gold Traditional Punjabi',
        category: 'Panjabi',
        price: 5000,
        discountPrice: 4200,
        images: ['https://images.unsplash.com/photo-1608748010899-18f300247112?w=500&auto=format&fit=crop'],
        stock: 8,
        variants: {
          sizes: ['L', 'XL', 'XXL'],
          colors: ['#ffd700', '#ffffff']
        },
        description: 'High-quality traditional Banarasi cotton Panjabi embroidered with intricate thread work on the collar and chest panel. Sleek, comfortable, and perfect for religious festivals.',
        ratings: { average: 5.0, count: 32 }
      }
    ];

    await Product.insertMany(items);
    console.log('Seeded apparel catalog items successfully.');

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
