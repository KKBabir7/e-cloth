const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  canvasJson: {
    type: mongoose.Schema.Types.Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  previewImage: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Design', designSchema);
