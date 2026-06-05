const Coupon = require('../models/Coupon');

/**
 * @desc    Create promo coupon code
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, maxDiscount, expiryDate } = req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Please provide code, discountType, discountValue, and expiryDate' });
    }

    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || 0,
      expiryDate: new Date(expiryDate)
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    console.error('Create coupon error:', error.message);
    res.status(500).json({ success: false, message: 'Server coupon create error' });
  }
};

/**
 * @desc    Get all coupons catalog
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    console.error('Get coupons error:', error.message);
    res.status(500).json({ success: false, message: 'Server coupons fetch error' });
  }
};

/**
 * @desc    Apply and validate coupon during checkout
 * @route   POST /api/coupons/validate
 * @access  Private
 */
const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || !cartTotal) {
      return res.status(400).json({ success: false, message: 'Please provide coupon code and cart total amount' });
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

    // Minimum Purchase Check
    if (Number(cartTotal) < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ৳${coupon.minPurchase} is required to use this coupon`
      });
    }

    // Calculate Discount Amount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (Number(cartTotal) * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    // Ensure discount does not exceed total
    if (discount > Number(cartTotal)) {
      discount = Number(cartTotal);
    }

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully!',
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
      newTotal: Number(cartTotal) - discount
    });
  } catch (error) {
    console.error('Validate coupon error:', error.message);
    res.status(500).json({ success: false, message: 'Server coupon validation error' });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  validateCoupon
};
