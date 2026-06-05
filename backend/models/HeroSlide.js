const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  badge: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: [true, 'Please provide slide image URL']
  },
  link: {
    type: String,
    default: '/shop'
  },
  buttonText: {
    type: String,
    default: 'Shop Now'
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
