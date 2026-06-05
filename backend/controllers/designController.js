const Design = require('../models/Design');

/**
 * @desc    Save a custom T-shirt design
 * @route   POST /api/design/save
 * @access  Private
 */
const saveDesign = async (req, res) => {
  try {
    const { productId, canvasJson, previewImage } = req.body;

    if (!canvasJson || !previewImage) {
      return res.status(400).json({ success: false, message: 'Please provide canvasJson and previewImage payload' });
    }

    const design = await Design.create({
      userId: req.user._id,
      productId: productId || null,
      canvasJson,
      previewImage
    });

    res.status(201).json({
      success: true,
      message: 'Design saved successfully',
      design
    });
  } catch (error) {
    console.error('Save design error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving design: ' + error.message });
  }
};

/**
 * @desc    Get logged in user's saved designs
 * @route   GET /api/design/user
 * @access  Private
 */
const getUserDesigns = async (req, res) => {
  try {
    const designs = await Design.find({ userId: req.user._id })
      .populate('productId', 'name price images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: designs.length,
      designs
    });
  } catch (error) {
    console.error('Get user designs error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching user designs' });
  }
};

module.exports = {
  saveDesign,
  getUserDesigns
};
