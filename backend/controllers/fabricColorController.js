const FabricColor = require('../models/FabricColor');
const { broadcast } = require('../utils/sseManager');

// ─── Public: get active fabric colors ─────────────────────────────────────
const getFabricColors = async (req, res) => {
  try {
    const colors = await FabricColor.find({ isActive: true }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: colors.length, colors });
  } catch (error) {
    console.error('Get fabric colors error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching fabric colors' });
  }
};

// ─── Admin: get all fabric colors ─────────────────────────────────────────
const adminGetFabricColors = async (req, res) => {
  try {
    const colors = await FabricColor.find({}).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: colors.length, colors });
  } catch (error) {
    console.error('Admin get fabric colors error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving administrative fabric colors list' });
  }
};

// ─── Admin: create fabric color ──────────────────────────────────────────
const createFabricColor = async (req, res) => {
  try {
    const { name, hex, image, price, discountPrice, sizes, isActive } = req.body;

    if (!name || !hex) {
      return res.status(400).json({ success: false, message: 'Please provide fabric color name and hex code value' });
    }

    const fabricColor = await FabricColor.create({
      name,
      hex,
      image: image || '',
      price: price !== undefined ? Number(price) : 1100,
      discountPrice: discountPrice !== undefined ? Number(discountPrice) : 0,
      sizes: sizes && Array.isArray(sizes) ? sizes : ['S', 'M', 'L', 'XL', 'XXL'],
      isActive: isActive !== undefined ? isActive : true
    });

    broadcast('fabric-colors'); // notify real-time streams
    res.status(201).json({ success: true, message: 'Fabric color created successfully', fabricColor });
  } catch (error) {
    console.error('Create fabric color error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating fabric color' });
  }
};

// ─── Admin: update fabric color ──────────────────────────────────────────
const updateFabricColor = async (req, res) => {
  try {
    const { name, hex, image, price, discountPrice, sizes, isActive } = req.body;

    const fabricColor = await FabricColor.findById(req.params.id);
    if (!fabricColor) {
      return res.status(404).json({ success: false, message: 'Fabric color not found' });
    }

    if (name) fabricColor.name = name;
    if (hex) fabricColor.hex = hex;
    if (image !== undefined) fabricColor.image = image;
    if (price !== undefined) fabricColor.price = Number(price);
    if (discountPrice !== undefined) fabricColor.discountPrice = Number(discountPrice);
    if (sizes && Array.isArray(sizes)) fabricColor.sizes = sizes;
    if (isActive !== undefined) fabricColor.isActive = isActive;

    await fabricColor.save();

    broadcast('fabric-colors'); // notify real-time streams
    res.status(200).json({ success: true, message: 'Fabric color updated successfully', fabricColor });
  } catch (error) {
    console.error('Update fabric color error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating fabric color' });
  }
};

// ─── Admin: delete fabric color ──────────────────────────────────────────
const deleteFabricColor = async (req, res) => {
  try {
    const fabricColor = await FabricColor.findById(req.params.id);
    if (!fabricColor) {
      return res.status(404).json({ success: false, message: 'Fabric color not found' });
    }

    await FabricColor.findByIdAndDelete(req.params.id);

    broadcast('fabric-colors'); // notify real-time streams
    res.status(200).json({ success: true, message: 'Fabric color deleted successfully' });
  } catch (error) {
    console.error('Delete fabric color error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting fabric color' });
  }
};

// ─── Seeder ───────────────────────────────────────────────────────────────
const seedDefaultFabricColors = async () => {
  try {
    const count = await FabricColor.countDocuments();
    if (count === 0) {
      console.log('Seeding default customizer fabric colors in MongoDB...');
      const defaults = [
        { name: 'White', hex: '#ffffff', image: '', price: 1100, discountPrice: 0, sizes: ['S', 'M', 'L', 'XL', 'XXL'], isActive: true },
        { name: 'Black', hex: '#0f172a', image: '', price: 1100, discountPrice: 0, sizes: ['S', 'M', 'L', 'XL', 'XXL'], isActive: true },
        { name: 'Crimson', hex: '#dc2626', image: '', price: 1100, discountPrice: 0, sizes: ['S', 'M', 'L', 'XL', 'XXL'], isActive: true },
        { name: 'Royal Blue', hex: '#1e3a8a', image: '', price: 1100, discountPrice: 0, sizes: ['S', 'M', 'L', 'XL', 'XXL'], isActive: true },
        { name: 'Navy Gray', hex: '#475569', image: '', price: 1100, discountPrice: 0, sizes: ['S', 'M', 'L', 'XL', 'XXL'], isActive: true }
      ];
      await FabricColor.insertMany(defaults);
      console.log('Seeded 5 default fabric colors successfully.');
    }
  } catch (error) {
    console.error('Fabric color seeding error:', error.message);
  }
};

module.exports = {
  getFabricColors,
  adminGetFabricColors,
  createFabricColor,
  updateFabricColor,
  deleteFabricColor,
  seedDefaultFabricColors
};
