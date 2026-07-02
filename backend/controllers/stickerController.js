const Sticker = require('../models/Sticker');
const { broadcast } = require('../utils/sseManager');

// ─── Public: get active stickers ──────────────────────────────────────────
const getStickers = async (req, res) => {
  try {
    const stickers = await Sticker.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: stickers.length, stickers });
  } catch (error) {
    console.error('Get stickers error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching stickers' });
  }
};

// ─── Admin: get all stickers ──────────────────────────────────────────────
const adminGetStickers = async (req, res) => {
  try {
    const stickers = await Sticker.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: stickers.length, stickers });
  } catch (error) {
    console.error('Admin get stickers error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving administrative stickers list' });
  }
};

// ─── Admin: create sticker ─────────────────────────────────────────────────
const createSticker = async (req, res) => {
  try {
    const { name, image, isActive } = req.body;

    if (!name || !image) {
      return res.status(400).json({ success: false, message: 'Please provide sticker name and image URL' });
    }

    const sticker = await Sticker.create({
      name,
      image,
      isActive: isActive !== undefined ? isActive : true
    });

    broadcast('stickers'); // Notify connected clients
    res.status(201).json({ success: true, message: 'Sticker created successfully', sticker });
  } catch (error) {
    console.error('Create sticker error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating sticker' });
  }
};

// ─── Admin: update sticker ─────────────────────────────────────────────────
const updateSticker = async (req, res) => {
  try {
    const { name, image, isActive } = req.body;

    const sticker = await Sticker.findById(req.params.id);
    if (!sticker) {
      return res.status(404).json({ success: false, message: 'Sticker not found' });
    }

    if (name) sticker.name = name;
    if (image) sticker.image = image;
    if (isActive !== undefined) sticker.isActive = isActive;

    await sticker.save();

    broadcast('stickers'); // Notify connected clients
    res.status(200).json({ success: true, message: 'Sticker updated successfully', sticker });
  } catch (error) {
    console.error('Update sticker error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating sticker' });
  }
};

// ─── Admin: delete sticker ─────────────────────────────────────────────────
const deleteSticker = async (req, res) => {
  try {
    const sticker = await Sticker.findById(req.params.id);
    if (!sticker) {
      return res.status(404).json({ success: false, message: 'Sticker not found' });
    }

    await Sticker.findByIdAndDelete(req.params.id);

    broadcast('stickers'); // Notify connected clients
    res.status(200).json({ success: true, message: 'Sticker deleted successfully' });
  } catch (error) {
    console.error('Delete sticker error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting sticker' });
  }
};

// ─── Seeder ─────────────────────────────────────────────────────────────────
const seedDefaultStickers = async () => {
  try {
    const count = await Sticker.countDocuments();
    if (count === 0) {
      console.log('Seeding default customizer stickers in MongoDB...');
      const defaults = [
        { name: "Fire", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.png", isActive: true },
        { name: "Rocket", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.png", isActive: true },
        { name: "Cool Sun", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.png", isActive: true },
        { name: "Sparkles", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.png", isActive: true },
        { name: "Alien", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47d/512.png", isActive: true },
        { name: "Tiger", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f42f/512.png", isActive: true },
        { name: "Skull", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f480/512.png", isActive: true },
        { name: "Heart Sparks", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.png", isActive: true },
        { name: "Crown", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.png", isActive: true },
        { name: "Game Controller", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ae/512.png", isActive: true },
        { name: "Music Headphone", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3a7/512.png", isActive: true },
        { name: "Pizza Slice", image: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f355/512.png", isActive: true }
      ];
      await Sticker.insertMany(defaults);
      console.log('Seeded 12 default stickers successfully.');
    }
  } catch (error) {
    console.error('Sticker seeding error:', error.message);
  }
};

module.exports = {
  getStickers,
  adminGetStickers,
  createSticker,
  updateSticker,
  deleteSticker,
  seedDefaultStickers
};
