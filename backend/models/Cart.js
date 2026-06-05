const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  image: String,
  size: String,
  color: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  customDesignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    default: null
  },
  previewImage: String
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  items: [cartItemSchema],
  coupon: {
    type: Object,
    default: null
  },
  deliveryCharge: {
    type: Number,
    default: 80
  },
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Partial TTL index: expire guest carts after 30 days of inactivity
cartSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { userId: null }
  }
);

module.exports = mongoose.model('Cart', cartSchema);
