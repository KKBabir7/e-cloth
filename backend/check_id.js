const mongoose = require('mongoose');
const Design = require('./models/Design');
const CustomOrder = require('./models/CustomOrder');

const MONGO_URI = 'mongodb+srv://sadin54780_db_user:sadincom@ecommerce.swchaej.mongodb.net/customwear?retryWrites=true&w=majority&appName=ecommerce';
const targetId = '6a5d4574bf28983fc1808851';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const design = await Design.findById(targetId);
    console.log('In Design collection:', design ? 'FOUND' : 'NOT FOUND');
    if (design) {
      console.log('Design userId:', design.userId);
    }

    const customOrder = await CustomOrder.findById(targetId);
    console.log('In CustomOrder collection:', customOrder ? 'FOUND' : 'NOT FOUND');
    if (customOrder) {
      console.log('CustomOrder userId:', customOrder.userId);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
