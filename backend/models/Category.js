const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide category name'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Please provide category slug'],
    trim: true,
    unique: true,
    index: true
  },
  image: {
    type: String,
    required: [true, 'Please provide category thumbnail image']
  },
  tagline: {
    type: String,
    trim: true,
    default: ''
  },
  accentColor: {
    type: String,
    trim: true,
    default: '#ff8525'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    trim: true,
    default: 'BsTags'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
