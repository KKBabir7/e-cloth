const Media = require('../models/Media');
const path = require('path');
const fs = require('fs');
const { broadcast } = require('../utils/sseManager');

/**
 * @desc    Upload an image to media library
 * @route   POST /api/media/upload
 * @access  Private/Admin
 */
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const fileUrl = `/uploads/media/${req.file.filename}`;

    const media = await Media.create({
      url: fileUrl,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    broadcast('media');
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      media
    });
  } catch (error) {
    console.error('Upload media error:', error.message);
    res.status(500).json({ success: false, message: 'Server error uploading file: ' + error.message });
  }
};

/**
 * @desc    Get all uploaded media assets
 * @route   GET /api/media
 * @access  Private/Admin
 */
const getMedia = async (req, res) => {
  try {
    const mediaList = await Media.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: mediaList.length,
      media: mediaList
    });
  } catch (error) {
    console.error('Get media error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving media assets' });
  }
};

/**
 * @desc    Delete a media asset from library
 * @route   DELETE /api/media/:id
 * @access  Private/Admin
 */
const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media asset not found' });
    }

    // Attempt to delete physical file from disk
    const filePath = path.join(__dirname, '..', media.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete physical file: ${filePath}`, err.message);
      }
    }

    await Media.findByIdAndDelete(req.params.id);

    broadcast('media');
    res.status(200).json({
      success: true,
      message: 'Media asset deleted successfully'
    });
  } catch (error) {
    console.error('Delete media error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting media asset' });
  }
};

module.exports = {
  uploadMedia,
  getMedia,
  deleteMedia
};
