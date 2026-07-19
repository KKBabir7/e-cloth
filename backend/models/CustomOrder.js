const mongoose = require('mongoose');

const customOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  productType: {
    type: String,
    required: true,
    enum: ['tshirt', 'polo']
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  color: {
    type: String,
    required: true,
    default: '#ffffff'
  },
  size: {
    type: String,
    required: true,
    default: 'L'
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  canvasJson: {
    type: mongoose.Schema.Types.Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  previewImage: {
    type: String, // Data URL or path
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Cart', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Cart',
    index: true
  },
  sessionId: {
    type: String, // For tracking guests or temporary cart sessions
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomOrder', customOrderSchema);
