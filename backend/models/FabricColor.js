const mongoose = require('mongoose');

const fabricColorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide fabric color name'],
    trim: true
  },
  hex: {
    type: String,
    required: [true, 'Please provide fabric color hex code'],
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 1100
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  sizes: {
    type: [String],
    default: ['S', 'M', 'L', 'XL', 'XXL']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FabricColor', fabricColorSchema);
