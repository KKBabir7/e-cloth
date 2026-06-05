const HeroSlide = require('../models/HeroSlide');
const { broadcast } = require('../utils/sseManager');

// ─── Seeding ───────────────────────────────────────────────────────────────
const seedDefaultSlides = async () => {
  try {
    const count = await HeroSlide.countDocuments();
    if (count === 0) {
      console.log('No hero slides found — skipping seed (add banners via Admin Panel)');
    }
  } catch (error) {
    console.error('Hero slides check error:', error.message);
  }
};

// ─── Public: get active slides ─────────────────────────────────────────────
const getSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, slides });
  } catch (error) {
    console.error('Get slides error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving slides' });
  }
};

// ─── Admin: get all slides ─────────────────────────────────────────────────
const adminGetSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find({}).sort({ order: 1 });
    res.status(200).json({ success: true, slides });
  } catch (error) {
    console.error('Admin get slides error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving administrative slides list' });
  }
};

// ─── Admin: create slide ───────────────────────────────────────────────────
const createSlide = async (req, res) => {
  try {
    const { title, subtitle, badge, image, link, buttonText, isCustom, order, isActive } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Please provide a slide banner image URL' });
    }

    const slide = await HeroSlide.create({
      title,
      subtitle,
      badge,
      image,
      link,
      buttonText,
      isCustom,
      order: Number(order || 0),
      isActive
    });

    broadcast('hero-slides'); // 🔔 notify all connected browsers instantly
    res.status(201).json({ success: true, message: 'Hero slide created successfully', slide });
  } catch (error) {
    console.error('Create slide error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating slide' });
  }
};

// ─── Admin: update slide ───────────────────────────────────────────────────
const updateSlide = async (req, res) => {
  try {
    const { title, subtitle, badge, image, link, buttonText, isCustom, order, isActive } = req.body;

    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Hero slide not found' });
    }

    slide.title = title || slide.title;
    slide.subtitle = subtitle !== undefined ? subtitle : slide.subtitle;
    slide.badge = badge !== undefined ? badge : slide.badge;
    slide.image = image || slide.image;
    slide.link = link !== undefined ? link : slide.link;
    slide.buttonText = buttonText || slide.buttonText;
    slide.isCustom = isCustom !== undefined ? isCustom : slide.isCustom;
    slide.order = order !== undefined ? Number(order) : slide.order;
    slide.isActive = isActive !== undefined ? isActive : slide.isActive;

    await slide.save();

    broadcast('hero-slides'); // 🔔 notify all connected browsers instantly
    res.status(200).json({ success: true, message: 'Hero slide updated successfully', slide });
  } catch (error) {
    console.error('Update slide error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating slide' });
  }
};

// ─── Admin: delete slide ───────────────────────────────────────────────────
const deleteSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Hero slide not found' });
    }

    await HeroSlide.findByIdAndDelete(req.params.id);

    broadcast('hero-slides'); // 🔔 notify all connected browsers instantly
    res.status(200).json({ success: true, message: 'Hero slide deleted successfully' });
  } catch (error) {
    console.error('Delete slide error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting slide' });
  }
};

module.exports = {
  seedDefaultSlides,
  getSlides,
  adminGetSlides,
  createSlide,
  updateSlide,
  deleteSlide
};
