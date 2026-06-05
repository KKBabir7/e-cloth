const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { getOrderQueue } = require('../config/db');
const { calculateDeliveryCharge } = require('../../shared/utils');

/**
 * @desc    Submit checkout order (Dispatch to background queue)
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod, paymentDetails, couponCode } = req.body;

    if (!products || products.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Please provide items and a valid shipping address' });
    }

    // 1. Calculate and Verify Amount from DB (Avoid client pricing hacks)
    let subtotal = 0;
    for (const item of products) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }
      
      const price = dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price;
      subtotal += price * item.quantity;
      item.price = price; // attach verified database price
    }

    // 2. Shipping calculation using shared module
    const deliveryCharge = calculateDeliveryCharge(shippingAddress.district);
    let discountAmount = 0;

    // 3. Optional Coupon calculation
    if (couponCode) {
      const activeCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (activeCoupon && new Date(activeCoupon.expiryDate) >= new Date() && subtotal >= activeCoupon.minPurchase) {
        if (activeCoupon.discountType === 'percentage') {
          discountAmount = (subtotal * activeCoupon.discountValue) / 100;
          if (activeCoupon.maxDiscount > 0 && discountAmount > activeCoupon.maxDiscount) {
            discountAmount = activeCoupon.maxDiscount;
          }
        } else {
          discountAmount = activeCoupon.discountValue;
        }
      }
    }

    const totalAmount = Math.max(0, (subtotal + deliveryCharge) - discountAmount);
    
    // 4. Generate unique readable ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `CWBD-${dateStr}-${randSuffix}`;

    // 5. Create Order record with Pending status
    const order = await Order.create({
      userId: req.user._id,
      orderId,
      products,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending', // pending until verified by queue worker
      paymentDetails,
      deliveryCharge,
      discountAmount,
      totalAmount,
      status: 'Pending'
    });

    // 6. Queue BullMQ Order Processing Job
    const orderQueue = getOrderQueue();
    if (orderQueue) {
      await orderQueue.add('process-new-order', {
        orderDbId: order._id,
        orderId: order.orderId,
        userId: req.user._id,
        products: order.products,
        paymentMethod,
        paymentDetails
      });
      console.log(`Order job dispatched for orderId: ${orderId}`);
    } else {
      console.warn('BullMQ orderQueue instance unavailable. Processing synchronously in fallback.');
      try {
        const orderRecord = await Order.findById(order._id);
        if (orderRecord) {
          for (const item of products) {
            const product = await Product.findById(item.productId);
            if (product) {
              product.stock = Math.max(0, product.stock - item.quantity);
              await product.save();
            }
          }
          if (paymentMethod === 'bKash' || paymentMethod === 'Nagad') {
            orderRecord.paymentStatus = 'Paid';
            if (orderRecord.paymentDetails) {
              orderRecord.paymentDetails.paidAt = new Date();
            }
          } else {
            orderRecord.paymentStatus = 'Pending';
          }
          orderRecord.status = 'Processing';
          await orderRecord.save();
          console.log(`Order ${orderId} successfully processed in fallback mode (No Redis).`);
        }
      } catch (fallbackErr) {
        console.error('Fallback processing error:', fallbackErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order received and placed into processing queue!',
      orderId: order.orderId,
      order
    });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({ success: false, message: 'Server order submission error: ' + error.message });
  }
};

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/user
 * @access  Private
 */
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('products.productId', 'name images category')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get user orders error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving user orders' });
  }
};

/**
 * @desc    Get all orders for administration panel
 * @route   GET /api/orders/admin
 * @access  Private/Admin
 */
const getAdminOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .populate('products.productId', 'name price images')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get admin orders error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching orders database' });
  }
};

/**
 * @desc    Update order workflow status (Admin control)
 * @route   PATCH /api/orders/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderDbId, status, paymentStatus } = req.body;

    if (!orderDbId || (!status && !paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Please provide orderDbId and status update payload' });
    }

    const order = await Order.findById(orderDbId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status || order.status}`,
      order
    });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ success: false, message: 'Server status modification error' });
  }
};

/**
 * @desc    Retrieve admin dashboard analytical statistics
 * @route   GET /api/orders/dashboard-stats
 * @access  Private/Admin
 */
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalOrdersObj = await Order.countDocuments({});
    
    // Revenue accumulation aggregation
    const revenueAggr = await Order.aggregate([
      { $match: { paymentStatus: 'Paid', status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAggr.length > 0 ? revenueAggr[0].totalRevenue : 0;

    // Categories orders analytics
    const salesChartData = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          ordersCount: { $sum: 1 },
          dailyRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 15 } // last 15 days
    ]);

    // Product stock alerts
    const stockAlerts = await Product.find({ stock: { $lte: 5 } }).select('name stock price category');

    // Product sales performance ranking
    const topProducts = await Order.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          quantitySold: { $sum: '$products.quantity' },
          totalSalesValue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 }
    ]);

    // Populate top product names
    const topSoldProducts = [];
    for (const item of topProducts) {
      const prod = await Product.findById(item._id).select('name price category images');
      if (prod) {
        topSoldProducts.push({
          productId: item._id,
          name: prod.name,
          category: prod.category,
          image: prod.images[0],
          quantitySold: item.quantitySold,
          totalSales: item.totalSalesValue
        });
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOrders: totalOrdersObj,
        totalRevenue,
        stockAlertsCount: stockAlerts.length,
        stockAlerts,
        topSoldProducts,
        salesChartData
      }
    });
  } catch (error) {
    console.error('Retrieve dashboard stats error:', error.message);
    res.status(500).json({ success: false, message: 'Server analytical dashboard aggregation error' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAdminOrders,
  updateOrderStatus,
  getAdminStats
};
