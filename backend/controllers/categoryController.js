const Category = require('../models/Category');
const { broadcast } = require('../utils/sseManager');

// ─── Public: get active categories ────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};

// ─── Admin: get all categories ────────────────────────────────────────────
const adminGetCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ order: 1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    console.error('Admin get categories error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving administrative categories list' });
  }
};

// ─── Admin: create category ───────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, slug, image, tagline, accentColor, order, isActive } = req.body;

    if (!name || !image) {
      return res.status(400).json({ success: false, message: 'Please provide category name and thumbnail image URL' });
    }

    const categorySlug = slug
      ? slug.trim()
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const duplicate = await Category.findOne({ slug: categorySlug });
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Category slug '${categorySlug}' already exists` });
    }

    const category = await Category.create({
      name,
      slug: categorySlug,
      image,
      tagline: tagline?.trim() || '',
      accentColor: accentColor?.trim() || '#ff8525',
      order: Number(order || 0),
      isActive: isActive !== undefined ? isActive : true
    });

    broadcast('categories'); // 🔔 notify all connected browsers instantly
    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    console.error('Create category error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating category' });
  }
};

// ─── Admin: update category ───────────────────────────────────────────────
const updateCategory = async (req, res) => {
  try {
    const { name, slug, image, tagline, accentColor, order, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) category.name = name;
    if (image) category.image = image;
    if (tagline !== undefined) category.tagline = tagline.trim();
    if (accentColor !== undefined) category.accentColor = accentColor.trim() || '#ff8525';
    if (order !== undefined) category.order = Number(order);
    if (isActive !== undefined) category.isActive = isActive;

    if (slug) {
      const categorySlug = slug.trim();
      if (categorySlug !== category.slug) {
        const duplicate = await Category.findOne({ slug: categorySlug, _id: { $ne: category._id } });
        if (duplicate) {
          return res.status(400).json({ success: false, message: `Category slug '${categorySlug}' already exists` });
        }
        category.slug = categorySlug;
      }
    }

    await category.save();

    broadcast('categories'); // 🔔 notify all connected browsers instantly
    res.status(200).json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Update category error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating category' });
  }
};

// ─── Admin: delete category ───────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);

    broadcast('categories'); // 🔔 notify all connected browsers instantly
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting category' });
  }
};

// ─── Seeder ───────────────────────────────────────────────────────────────
const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log('Seeding default categories in MongoDB...');
      const defaults = [
        { name: 'Custom T-Shirts', slug: 'T-shirt', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop', tagline: 'Comfort Wear', accentColor: '#ff8525', order: 0, isActive: true },
        { name: 'Polo Shirts', slug: 'Polo', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop', tagline: 'Smart Casual', accentColor: '#22c55e', order: 1, isActive: true },
        { name: 'Casual Shirts', slug: 'Shirt', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop', tagline: 'Everyday Style', accentColor: '#3b82f6', order: 2, isActive: true },
        { name: 'Traditional Panjabi', slug: 'Panjabi', image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=500&auto=format&fit=crop', tagline: 'Festive Look', accentColor: '#a855f7', order: 3, isActive: true }
      ];
      await Category.insertMany(defaults);
      console.log('Seeded 4 default categories successfully.');
    }
  } catch (error) {
    console.error('Category seeding error:', error.message);
  }
};

module.exports = {
  getCategories,
  adminGetCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories
};
