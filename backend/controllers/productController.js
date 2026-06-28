const Product = require('../models/Product');
const mongoose = require('mongoose');
const { invalidateProductCache } = require('../middleware/cache');
const { broadcast } = require('../utils/sseManager');

const findProductByIdOrSlug = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const product = await Product.findById(id);
    if (product) return product;
  }
  return Product.findOne({ slug: id });
};

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const LIST_FIELDS = [
  'name',
  'slug',
  'category',
  'price',
  'discountPrice',
  'images',
  'stock',
  'variants',
  'ratings',
  'featured',
  'trending',
  'createdAt'
].join(' ');

/**
 * @desc    Get all products (with pagination, filters, sorting)
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      size,
      color,
      rating,
      availability,
      sort,
      search,
      page = 1,
      limit = 12
    } = req.query;

    const queryObj = {};

    // 1. Text Search (Debounced on Frontend)
    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Category Filter — case-insensitive exact match so legacy products
    // saved with display-cased categories (e.g. "Polo") still match the
    // lowercase category slug (e.g. "polo") used by the storefront filters.
    if (category) {
      queryObj.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
    }

    // 3. Price Filter
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    // 4. Variant Filter (Size / Color)
    if (size) {
      queryObj['variants.sizes'] = size;
    }
    if (color) {
      // Hex colors could be passed, search inside variant array
      queryObj['variants.colors'] = color;
    }

    // 5. Ratings Filter
    if (rating) {
      queryObj['ratings.average'] = { $gte: Number(rating) };
    }

    // 6. Stock Availability Filter
    if (availability) {
      if (availability === 'inStock') {
        queryObj.stock = { $gt: 0 };
      } else if (availability === 'outOfStock') {
        queryObj.stock = 0;
      }
    }

    // 7. Sort Options
    let sortObj = { createdAt: -1 }; // default: newest arrivals
    if (sort) {
      if (sort === 'priceLowHigh') {
        sortObj = { price: 1 };
      } else if (sort === 'priceHighLow') {
        sortObj = { price: -1 };
      } else if (sort === 'popular') {
        sortObj = { 'ratings.count': -1, 'ratings.average': -1 };
      } else if (sort === 'newest') {
        sortObj = { createdAt: -1 };
      }
    }

    // 8. Pagination Setup
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const boundsQuery = {};
    if (category) boundsQuery.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };

    const [total, products, priceBoundsResult] = await Promise.all([
      Product.countDocuments(queryObj),
      Product.find(queryObj)
        .select(LIST_FIELDS)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.aggregate([
        { $match: boundsQuery },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ])
    ]);

    const priceBounds = {
      min: priceBoundsResult[0]?.minPrice ?? 0,
      max: priceBoundsResult[0]?.maxPrice ?? 0
    };

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      priceBounds,
      products
    });
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ success: false, message: 'Server product fetch error: ' + error.message });
  }
};

/**
 * @desc    Get single product details
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    let product;
    const { id } = req.params;
    
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).lean();
    }
    
    if (!product) {
      product = await Product.findOne({ slug: id }).lean();
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Get single product error:', error.message);
    res.status(500).json({ success: false, message: 'Server product details error: ' + error.message });
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      category, 
      price, 
      discountPrice, 
      stock, 
      variants, 
      description, 
      images,
      slug,
      sku,
      status,
      featured,
      trending,
      specifications,
      seoTitle,
      seoDescription,
      colorImages,
      shippingReturns,
      sizeGuide
    } = req.body;

    if (!name || !category || !price || !description) {
      return res.status(400).json({ success: false, message: 'Required fields missing: name, category, price, description' });
    }

    const productImages = images && images.length > 0 
      ? images 
      : ['/images/placeholder-shirt.png']; // default placeholder

    const slugify = (text) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    let computedSlug = slug ? slugify(slug) : slugify(name);
    if (!computedSlug) {
      computedSlug = 'product-' + Date.now();
    }

    const product = await Product.create({
      name,
      slug: computedSlug,
      sku: sku || '',
      category,
      price,
      discountPrice: discountPrice || 0,
      stock: stock || 0,
      variants: variants || { sizes: ['M', 'L', 'XL'], colors: ['#000000', '#ffffff'] },
      colorImages: colorImages || {},
      specifications: specifications || '',
      status: status || 'Active',
      featured: !!featured,
      trending: !!trending,
      description,
      images: productImages,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
      shippingReturns: shippingReturns || '',
      sizeGuide: sizeGuide || ''
    });

    // Invalidate Redis product catalogue cache instantly
    await invalidateProductCache();

    broadcast('products'); // 🔔 notify all connected browsers instantly
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ success: false, message: 'Server product creation error: ' + error.message });
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Safeguard to ensure timestamps are not overwritten by incoming body payloads
    delete req.body.createdAt;
    delete req.body.updatedAt;

    const slugify = (text) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    if (req.body.name && (!req.body.slug || req.body.slug.trim() === '')) {
      req.body.slug = slugify(req.body.name);
    } else if (req.body.slug) {
      req.body.slug = slugify(req.body.slug);
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Invalidate product cache
    await invalidateProductCache();

    broadcast('products'); // 🔔 notify all connected browsers instantly
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ success: false, message: 'Server product update error' });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Invalidate product cache
    await invalidateProductCache();

    broadcast('products'); // 🔔 notify all connected browsers instantly
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({ success: false, message: 'Server product deletion error' });
  }
};

/**
 * @desc    Add product review
 * @route   POST /api/products/:id/reviews
 * @access  Public (logged-in users use account name)
 */
const addProductReview = async (req, res) => {
  try {
    const { rating, comment, name } = req.body;
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please login to submit a review' });
    }

    let reviewerName = req.user.name;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superAdmin';
    if (isAdmin && name && name.trim()) {
      reviewerName = name.trim();
    }

    if (!reviewerName || !rating || !comment?.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide rating (1-5) and review comment' });
    }

    const product = await findProductByIdOrSlug(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = {
      name: reviewerName,
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date()
    };

    product.reviews.push(review);

    // Recalculate rating average and count
    product.ratings.count = product.reviews.length;
    
    const totalRating = product.reviews.reduce((sum, item) => sum + item.rating, 0);
    product.ratings.average = Number((totalRating / product.reviews.length).toFixed(2));

    await product.save();

    // Invalidate product cache
    await invalidateProductCache();
    broadcast('products');

    res.status(201).json({ success: true, message: 'Review added successfully', product });
  } catch (error) {
    console.error('Add review error:', error.message);
    res.status(500).json({ success: false, message: 'Server review submission error: ' + error.message });
  }
};

/**
 * @desc    Delete product review
 * @route   DELETE /api/products/:id/reviews/:reviewId
 * @access  Private/Admin
 */
const deleteProductReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Filter out the review to delete
    product.reviews = product.reviews.filter(
      (r) => r._id.toString() !== reviewId
    );

    // Recalculate average rating and count
    product.ratings.count = product.reviews.length;
    if (product.reviews.length > 0) {
      const totalRating = product.reviews.reduce((sum, item) => sum + item.rating, 0);
      product.ratings.average = Number((totalRating / product.reviews.length).toFixed(2));
    } else {
      product.ratings.average = 0;
    }

    await product.save();

    // Invalidate product cache
    await invalidateProductCache();
    broadcast('products');

    res.status(200).json({ success: true, message: 'Review deleted successfully', product });
  } catch (error) {
    console.error('Delete review error:', error.message);
    res.status(500).json({ success: false, message: 'Server review deletion error: ' + error.message });
  }
};

/**
 * @desc    Update product review
 * @route   PUT /api/products/:id/reviews/:reviewId
 * @access  Private/Admin
 */
const updateProductReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { name, rating, comment } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide reviewer name, rating (1-5), and review comment' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.name = name;
    review.rating = Number(rating);
    review.comment = comment;

    // Recalculate rating average
    const totalRating = product.reviews.reduce((sum, item) => sum + item.rating, 0);
    product.ratings.average = Number((totalRating / product.reviews.length).toFixed(2));

    await product.save();

    // Invalidate product cache
    await invalidateProductCache();
    broadcast('products');

    res.status(200).json({ success: true, message: 'Review updated successfully', product });
  } catch (error) {
    console.error('Update review error:', error.message);
    res.status(500).json({ success: false, message: 'Server review update error: ' + error.message });
  }
};

/**
 * @desc    Get all reviews across all products (Admin only)
 * @route   GET /api/products/reviews/all
 * @access  Private/Admin
 */
const getAllReviews = async (req, res) => {
  try {
    const products = await Product.find({ 'reviews.0': { $exists: true } }, 'name reviews').lean();
    
    // Flatten reviews and attach product info
    const reviews = [];
    products.forEach(product => {
      if (product.reviews) {
        product.reviews.forEach(review => {
          reviews.push({
            _id: review._id,
            productId: product._id,
            productName: product.name,
            name: review.name,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt
          });
        });
      }
    });

    // Sort by newest first
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    console.error('Get all reviews error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching reviews: ' + error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  deleteProductReview,
  updateProductReview,
  getAllReviews
};
