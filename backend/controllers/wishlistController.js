const Wishlist = require('../models/Wishlist');

/**
 * Helper to fetch or create a wishlist
 */
const getOrCreateWishlist = async (userId, sessionId) => {
  let wishlist;
  if (userId) {
    wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, sessionId, products: [] });
    }
  } else {
    wishlist = await Wishlist.findOne({ sessionId, userId: null });
    if (!wishlist) {
      wishlist = await Wishlist.create({ sessionId, userId: null, products: [] });
    }
  }
  return wishlist;
};

/**
 * @desc    Get user or guest wishlist
 * @route   GET /api/wishlist
 * @access  Public
 */
const getWishlist = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.cartSessionId;

    const wishlist = await getOrCreateWishlist(userId, sessionId);
    await wishlist.populate('products');

    res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    console.error('Get wishlist error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving wishlist' });
  }
};

/**
 * @desc    Add product to user or guest wishlist
 * @route   POST /api/wishlist
 * @access  Public
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Please provide product ID' });
    }

    const userId = req.user ? req.user._id : null;
    const sessionId = req.cartSessionId;

    const wishlist = await getOrCreateWishlist(userId, sessionId);

    // Prevent duplicate entries
    const exists = wishlist.products.some(p => p.toString() === productId.toString());
    if (!exists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate('products');

    res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving wishlist item' });
  }
};

/**
 * @desc    Remove product from user or guest wishlist
 * @route   DELETE /api/wishlist/:productId
 * @access  Public
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user ? req.user._id : null;
    const sessionId = req.cartSessionId;

    const wishlist = await Wishlist.findOne(userId ? { userId } : { sessionId, userId: null });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(p => p.toString() !== productId.toString());
      await wishlist.save();
      await wishlist.populate('products');
    }

    res.status(200).json({
      success: true,
      wishlist: wishlist || { products: [] }
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error.message);
    res.status(500).json({ success: false, message: 'Server error removing wishlist item' });
  }
};

/**
 * Helper function to merge guest wishlist into user wishlist on login
 */
const mergeGuestWishlist = async (userId, sessionId) => {
  if (!sessionId) return;
  try {
    const guestWishlist = await Wishlist.findOne({ sessionId, userId: null });
    if (!guestWishlist || guestWishlist.products.length === 0) return;

    let userWishlist = await Wishlist.findOne({ userId });
    if (!userWishlist) {
      guestWishlist.userId = userId;
      await guestWishlist.save();
      return;
    }

    // Merge arrays avoiding duplicates
    guestWishlist.products.forEach(prodId => {
      const exists = userWishlist.products.some(p => p.toString() === prodId.toString());
      if (!exists) {
        userWishlist.products.push(prodId);
      }
    });

    await userWishlist.save();
    await Wishlist.deleteOne({ _id: guestWishlist._id });
  } catch (error) {
    console.error('Error merging guest wishlist:', error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  mergeGuestWishlist
};
