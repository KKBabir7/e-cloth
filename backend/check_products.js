const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/e-cloth')
  .then(async () => {
    console.log('MongoDB Connected');
    const products = await Product.find({}, 'name slug ratings reviews');
    console.log(JSON.stringify(products, null, 2));
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Connection error', err);
  });
