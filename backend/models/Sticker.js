const mongoose = require('mongoose');

const stickerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide sticker name'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Please provide sticker image URL']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sticker', stickerSchema);
