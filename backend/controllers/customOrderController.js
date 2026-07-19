const CustomOrder = require('../models/CustomOrder');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

exports.addToCartCustomOrder = async (req, res) => {
  try {
    const { 
      productType, 
      productId, 
      color, 
      size, 
      quantity, 
      price, 
      canvasJson, 
      previewImage, 
      sessionId 
    } = req.body;

    const userId = req.user ? req.user._id : null;

    const customOrder = new CustomOrder({
      userId,
      sessionId: userId ? null : sessionId,
      productType,
      productId,
      color,
      size,
      quantity,
      price,
      canvasJson,
      previewImage,
      status: 'Cart'
    });

    await customOrder.save();

    res.status(201).json({
      success: true,
      customOrder,
      message: 'Custom design added to cart successfully'
    });
  } catch (error) {
    console.error('Error in addToCartCustomOrder:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.removeFromCartCustomOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user._id : null;
    const { sessionId } = req.body;

    const customOrder = await CustomOrder.findById(id);

    if (!customOrder) {
      return res.status(404).json({ success: false, message: 'Custom order not found' });
    }

    if (customOrder.status !== 'Cart') {
      return res.status(400).json({ success: false, message: 'Cannot remove order that is not in cart' });
    }

    // Ensure authorization
    if ((userId && customOrder.userId && customOrder.userId.toString() === userId.toString()) ||
        (!userId && customOrder.sessionId === sessionId)) {
      await CustomOrder.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Custom order removed from cart' });
    }

    return res.status(403).json({ success: false, message: 'Unauthorized' });
  } catch (error) {
    console.error('Error in removeFromCartCustomOrder:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Admin Endpoints
exports.getAllCustomOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { status: { $ne: 'Cart' } }; // Admin only sees placed orders

    if (status && status !== 'All') {
      query.status = status;
    }

    const customOrders = await CustomOrder.find(query)
      .populate('userId', 'name email phone')
      .populate('productId', 'name')
      .populate('orderId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await CustomOrder.countDocuments(query);

    res.json({
      success: true,
      customOrders,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error in getAllCustomOrders:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getCustomOrderById = async (req, res) => {
  try {
    const customOrder = await CustomOrder.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('productId', 'name')
      .populate('orderId');

    if (!customOrder) {
      return res.status(404).json({ success: false, message: 'Custom order not found' });
    }

    res.json({ success: true, customOrder });
  } catch (error) {
    console.error('Error in getCustomOrderById:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateCustomOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const customOrder = await CustomOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!customOrder) {
      return res.status(404).json({ success: false, message: 'Custom order not found' });
    }

    res.json({ success: true, customOrder, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error in updateCustomOrderStatus:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getUserCustomDesigns = async (req, res) => {
  try {
    const userId = req.user._id;
    // Get confirmed custom orders for this user to act as their design history
    const designs = await CustomOrder.find({ userId, status: { $ne: 'Cart' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, designs });
  } catch (error) {
    console.error('Error in getUserCustomDesigns:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
