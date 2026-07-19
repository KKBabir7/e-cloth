const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const CustomOrder = require('../models/CustomOrder');
const { broadcast } = require('../utils/sseManager');

/**
 * Helper to calculate totals for a cart
 */
const recalculateTotals = (cart) => {
  cart.subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  if (cart.coupon) {
    if (cart.coupon.discountType === 'percentage') {
      cart.discount = (cart.subtotal * cart.coupon.discountValue) / 100;
      if (cart.coupon.maxDiscount > 0 && cart.discount > cart.coupon.maxDiscount) {
        cart.discount = cart.coupon.maxDiscount;
      }
    } else {
      cart.discount = cart.coupon.discountValue;
    }
    
    // Ensure discount does not exceed subtotal
    if (cart.discount > cart.subtotal) {
      cart.discount = cart.subtotal;
    }
  } else {
    cart.discount = 0;
  }

  cart.total = Math.max(0, (cart.subtotal + cart.deliveryCharge) - cart.discount);
};

/**
 * Helper to find or create the active cart for a request
 */
const findActiveCart = async (req) => {
  if (req.user) {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      // If user has no cart, but we have a guest cart under their sessionId, associate it with the user
      cart = await Cart.findOne({ sessionId: req.cartSessionId, userId: null });
      if (cart) {
        cart.userId = req.user._id;
        await cart.save();
      } else {
        cart = await Cart.create({
          userId: req.user._id,
          sessionId: req.cartSessionId,
          items: []
        });
      }
    }
    return cart;
  } else {
    let cart = await Cart.findOne({ sessionId: req.cartSessionId, userId: null });
    if (!cart) {
      cart = await Cart.create({
        sessionId: req.cartSessionId,
        items: []
      });
    }
    return cart;
  }
};

/**
 * @desc    Get current cart
 * @route   GET /api/cart
 * @access  Public (Guest/User)
 */
exports.getCart = async (req, res) => {
  try {
    const cart = await findActiveCart(req);
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving cart: ' + error.message });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Public (Guest/User)
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, size, color, quantity = 1, isCustom = false, customDesignId = null, previewImage, image, name, price } = req.body;

    let targetProductId = productId;
    let product;

    if (isCustom && (!productId || productId === 'custom-apparel-001' || !mongoose.Types.ObjectId.isValid(productId))) {
      // Find or create a default custom product placeholder in the database
      product = await Product.findOne({ slug: 'custom-apparel-placeholder' });
      if (!product) {
        product = await Product.create({
          name: 'Custom Apparel',
          slug: 'custom-apparel-placeholder',
          price: 1100,
          category: 'tshirt',
          images: ['/placeholder.png'],
          stock: 9999,
          status: 'Active',
          description: 'Placeholder product for custom designs.'
        });
      }
      targetProductId = product._id;
    } else {
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid productId' });
      }
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      targetProductId = product._id;
    }

    const cart = await findActiveCart(req);

    // Match by targetProductId, size, color, and custom design identity
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === targetProductId.toString() &&
        item.size === size &&
        item.color === color &&
        item.isCustom === isCustom &&
        (customDesignId ? item.customDesignId?.toString() === customDesignId.toString() : !item.customDesignId)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        productId: targetProductId,
        name: isCustom ? name || `Custom ${product.name}` : product.name,
        price: isCustom ? price || product.price : (product.discountPrice > 0 ? product.discountPrice : product.price),
        image: isCustom ? (previewImage || image || product.images[0]) : product.images[0],
        size,
        color,
        quantity: Number(quantity),
        isCustom,
        customDesignId,
        previewImage: previewImage || image
      });
    }

    recalculateTotals(cart);
    await cart.save();
    broadcast('carts');

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Server error adding item to cart: ' + error.message });
  }
};

/**
 * @desc    Update item quantity in cart
 * @route   PUT /api/cart
 * @access  Public (Guest/User)
 */
exports.updateCartQty = async (req, res) => {
  try {
    const { productId, size, color, isCustom = false, customDesignId = null, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide productId and quantity' });
    }

    const cart = await findActiveCart(req);

    const item = cart.items.find(
      (i) =>
        i.productId.toString() === productId &&
        i.size === size &&
        i.color === color &&
        i.isCustom === isCustom &&
        (customDesignId ? i.customDesignId?.toString() === customDesignId : !i.customDesignId)
    );

    if (item) {
      item.quantity = Math.max(1, parseInt(quantity));
      recalculateTotals(cart);
      await cart.save();
      broadcast('carts');
      res.status(200).json({ success: true, cart });
    } else {
      res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
  } catch (error) {
    console.error('Update cart qty error:', error);
    res.status(500).json({ success: false, message: 'Server error updating cart quantity: ' + error.message });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart
 * @access  Public (Guest/User)
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { productId, size, color, isCustom = false, customDesignId = null } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Please provide productId' });
    }

    const cart = await findActiveCart(req);

    // If removing a custom design, delete its CustomOrder record too
    if (isCustom && customDesignId) {
      const itemToRemove = cart.items.find(
        (item) => item.productId.toString() === productId &&
                  item.size === size &&
                  item.color === color &&
                  item.isCustom === isCustom &&
                  item.customDesignId?.toString() === customDesignId
      );
      if (itemToRemove) {
        try {
          await CustomOrder.findByIdAndDelete(customDesignId);
        } catch (err) {
          console.error('Error deleting CustomOrder on cart remove:', err);
        }
      }
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.productId.toString() === productId &&
          item.size === size &&
          item.color === color &&
          item.isCustom === isCustom &&
          (customDesignId ? item.customDesignId?.toString() === customDesignId : !item.customDesignId)
        )
    );

    recalculateTotals(cart);
    await cart.save();
    broadcast('carts');

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Server error removing item from cart: ' + error.message });
  }
};

/**
 * @desc    Apply coupon to cart
 * @route   POST /api/cart/coupon
 * @access  Public (Guest/User)
 */
exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon code is invalid or has expired' });
    }

    // Expiry Check
    if (new Date(coupon.expiryDate) < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({ success: false, message: 'Coupon code has expired' });
    }

    const cart = await findActiveCart(req);

    // Minimum Purchase Check
    if (cart.subtotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ৳${coupon.minPurchase} is required to use this coupon`
      });
    }

    cart.coupon = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase,
      maxDiscount: coupon.maxDiscount
    };

    recalculateTotals(cart);
    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error applying coupon: ' + error.message });
  }
};

/**
 * @desc    Remove coupon from cart
 * @route   DELETE /api/cart/coupon
 * @access  Public (Guest/User)
 */
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await findActiveCart(req);
    cart.coupon = null;
    cart.discount = 0;
    recalculateTotals(cart);
    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error removing coupon: ' + error.message });
  }
};

/**
 * @desc    Update delivery charge in cart
 * @route   POST /api/cart/delivery
 * @access  Public (Guest/User)
 */
exports.updateDeliveryCharge = async (req, res) => {
  try {
    const { deliveryCharge } = req.body;

    if (deliveryCharge === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide deliveryCharge' });
    }

    const cart = await findActiveCart(req);
    cart.deliveryCharge = Number(deliveryCharge);
    recalculateTotals(cart);
    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Update delivery charge error:', error);
    res.status(500).json({ success: false, message: 'Server error updating delivery charge: ' + error.message });
  }
};

/**
 * @desc    Clear cart
 * @route   POST /api/cart/clear
 * @access  Public (Guest/User)
 */
exports.clearCart = async (req, res) => {
  try {
    const cart = await findActiveCart(req);
    cart.items = [];
    cart.coupon = null;
    cart.subtotal = 0;
    cart.discount = 0;
    cart.total = 0;
    await cart.save();
    broadcast('carts');
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Server error clearing cart: ' + error.message });
  }
};

/**
 * @desc    Get all carts in the system (Admin only)
 * @route   GET /api/cart/admin
 * @access  Private (Admin)
 */
exports.getCartsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.userType === 'registered') {
      query.userId = { $ne: null };
    } else if (req.query.userType === 'guest') {
      query.userId = null;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      const User = mongoose.model('User');
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }).select('_id');

      const userIds = matchingUsers.map(u => u._id);
      query.$or = [
        { userId: { $in: userIds } },
        { sessionId: searchRegex }
      ];
    }

    const carts = await Cart.find(query)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name price')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Cart.countDocuments(query);

    res.status(200).json({ 
      success: true, 
      carts,
      total,
      hasMore: total > page * limit
    });
  } catch (error) {
    console.error('Get admin carts error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving carts: ' + error.message });
  }
};

/**
 * @desc    Delete a full cart (Admin only)
 * @route   DELETE /api/cart/admin/:cartId
 * @access  Private (Admin)
 */
exports.deleteCartAdmin = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    // Delete any linked custom orders
    for (const item of cart.items) {
      if (item.isCustom && item.customDesignId) {
        try {
          await CustomOrder.findByIdAndDelete(item.customDesignId);
        } catch (err) {
          console.error('Error deleting CustomOrder:', err);
        }
      }
    }
    await cart.deleteOne();
    broadcast('carts');
    res.status(200).json({ success: true, message: 'Cart deleted successfully' });
  } catch (error) {
    console.error('Delete admin cart error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting cart: ' + error.message });
  }
};

/**
 * @desc    Delete a specific item from a cart (Admin only)
 * @route   DELETE /api/cart/admin/:cartId/item/:itemId
 * @access  Private (Admin)
 */
exports.deleteCartItemAdmin = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    const item = cart.items.find(i => i._id.toString() === req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    // If custom design, delete its CustomOrder record
    if (item.isCustom && item.customDesignId) {
      try {
        await CustomOrder.findByIdAndDelete(item.customDesignId);
      } catch (err) {
        console.error('Error deleting CustomOrder:', err);
      }
    }
    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    
    recalculateTotals(cart);
    await cart.save();
    broadcast('carts');
    
    res.status(200).json({ success: true, cart, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete admin cart item error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting item: ' + error.message });
  }
};
