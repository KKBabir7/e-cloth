const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

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
    const { productId, size, color, quantity = 1, isCustom = false, customDesignId = null, previewImage } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Please provide productId' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const cart = await findActiveCart(req);

    // Match by productId, size, color, and custom design identity
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.size === size &&
        item.color === color &&
        item.isCustom === isCustom &&
        (customDesignId ? item.customDesignId?.toString() === customDesignId : !item.customDesignId)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.discountPrice > 0 ? product.discountPrice : product.price,
        image: product.images[0],
        size,
        color,
        quantity: Number(quantity),
        isCustom,
        customDesignId,
        previewImage
      });
    }

    recalculateTotals(cart);
    await cart.save();

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
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Server error clearing cart: ' + error.message });
  }
};
