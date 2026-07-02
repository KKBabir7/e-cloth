const mongoose = require('mongoose');

const designPriceSettingSchema = new mongoose.Schema({
  textPrice: {
    type: Number,
    required: [true, 'Please provide text price per line'],
    default: 60
  },
  stickerPrice: {
    type: Number,
    required: [true, 'Please provide sticker price per item'],
    default: 40
  },
  imagePrice: {
    type: Number,
    required: [true, 'Please provide image price per item'],
    default: 50
  },
  shapePrice: {
    type: Number,
    required: [true, 'Please provide shape price per item'],
    default: 30
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DesignPriceSetting', designPriceSettingSchema);
