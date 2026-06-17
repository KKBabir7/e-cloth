const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide reviewer name']
  },
  rating: {
    type: Number,
    required: [true, 'Please provide star rating'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please provide review comment']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    index: true
  },
  slug: {
    type: String,
    trim: true,
    index: true
  },
  sku: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price must be positive']
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  images: [{
    type: String,
    required: true
  }],
  stock: {
    type: Number,
    required: [true, 'Please provide inventory stock level'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  variants: {
    sizes: {
      type: [String],
      enum: ['S', 'M', 'L', 'XL', 'XXL'],
      default: ['M', 'L', 'XL']
    },
    colors: {
      type: [String],
      default: ['#000000', '#ffffff', '#ff0000', '#0000ff']
    }
  },
  // Maps each color hex → a specific product image URL (for color-variant image switching)
  colorImages: {
    type: Map,
    of: String,
    default: {}
  },
  specifications: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Out of Stock'],
    default: 'Active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: [true, 'Please provide description']
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot be greater than 5']
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [reviewSchema],
  shippingReturns: {
    type: String,
    default: ''
  },
  sizeGuide: {
    type: String,
    default: ''
  },
  seoTitle: {
    type: String,
    trim: true,
    default: ''
  },
  seoDescription: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Catalog list/query indexes
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ 'ratings.count': -1, 'ratings.average': -1 });

module.exports = mongoose.model('Product', productSchema);
