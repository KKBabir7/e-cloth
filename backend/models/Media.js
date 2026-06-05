const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Please provide file URL']
  },
  filename: {
    type: String,
    required: [true, 'Please provide filename']
  },
  mimeType: {
    type: String,
    default: 'image/jpeg'
  },
  size: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
