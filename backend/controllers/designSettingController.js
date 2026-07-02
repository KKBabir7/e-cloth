const DesignPriceSetting = require('../models/DesignPriceSetting');
const { broadcast } = require('../utils/sseManager');

// Get customizer extra pricing configuration (returns singleton)
const getDesignSettings = async (req, res) => {
  try {
    let settings = await DesignPriceSetting.findOne({});
    if (!settings) {
      // Seed default settings on first get request
      settings = await DesignPriceSetting.create({
        textPrice: 60,
        stickerPrice: 40,
        imagePrice: 50,
        shapePrice: 30
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Get design settings error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving design settings' });
  }
};

// Update customizer extra pricing configuration
const updateDesignSettings = async (req, res) => {
  try {
    const { textPrice, stickerPrice, imagePrice, shapePrice } = req.body;

    let settings = await DesignPriceSetting.findOne({});
    if (!settings) {
      settings = new DesignPriceSetting();
    }

    if (textPrice !== undefined) settings.textPrice = Number(textPrice);
    if (stickerPrice !== undefined) settings.stickerPrice = Number(stickerPrice);
    if (imagePrice !== undefined) settings.imagePrice = Number(imagePrice);
    if (shapePrice !== undefined) settings.shapePrice = Number(shapePrice);

    await settings.save();

    broadcast('design-settings'); // Broadcast real-time SSE update to clients!
    res.status(200).json({ success: true, message: 'Design price settings updated successfully', settings });
  } catch (error) {
    console.error('Update design settings error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating design price settings' });
  }
};

module.exports = {
  getDesignSettings,
  updateDesignSettings
};
