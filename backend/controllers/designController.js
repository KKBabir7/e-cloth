const Design = require('../models/Design');

/**
 * @desc    Save a custom T-shirt design
 * @route   POST /api/design/save
 * @access  Private
 */
const saveDesign = async (req, res) => {
  try {
    const { productId, canvasJson, previewImage, garmentType, tshirtColor } = req.body;

    if (!canvasJson || !previewImage) {
      return res.status(400).json({ success: false, message: 'Please provide canvasJson and previewImage payload' });
    }

    const design = await Design.create({
      userId: req.user._id,
      productId: productId || null,
      canvasJson,
      previewImage,
      garmentType: garmentType || 'tshirt',
      tshirtColor: tshirtColor || '#ffffff'
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

/**
 * @desc    Delete a user's saved design
 * @route   DELETE /api/design/:id
 * @access  Private
 */
const deleteDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
    // Check if user owns the design
    if (design.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this design' });
    }
    await design.deleteOne();
    res.status(200).json({ success: true, message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Delete design error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting design' });
  }
};

/**
 * @desc    Get a specific saved design by ID
 * @route   GET /api/design/:id
 * @access  Private
 */
const getDesignById = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
    // Check if user owns the design
    if (design.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this design' });
    }
    res.status(200).json({
      success: true,
      design
    });
  } catch (error) {
    console.error('Get design by id error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving design' });
  }
};

module.exports = {
  saveDesign,
  getUserDesigns,
  deleteDesign,
  getDesignById
};
