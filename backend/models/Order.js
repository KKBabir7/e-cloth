const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  size: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL']
  },
  color: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  customDesignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design'
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  products: [orderProductSchema],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    district: { type: String, required: true },
    area: { type: String, required: true },
    addressLine: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'bKash', 'Nagad']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  paymentDetails: {
    transactionId: { type: String },
    senderPhone: { type: String },
    paidAt: { type: Date }
  },
  deliveryCharge: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  invoicePath: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
