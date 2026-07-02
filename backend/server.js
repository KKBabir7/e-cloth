const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');

// Initialize express app
const app = express();

// Secure express app headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading files from server in NextJS client
}));

// Setup Cross-Origin requests
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      process.env.NODE_ENV === 'development'
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Apply Gzip compression
app.use(compression());

// Setup request body parsers (Expanded limits for canvas JSON / Base64 upload payloads)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// DDoS protection rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // max 1000 requests per IP per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});
app.use('/api/', apiLimiter);

// Ensure file upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const designsDir = path.join(uploadDir, 'designs');
const invoicesDir = path.join(uploadDir, 'invoices');
const mediaDir = path.join(uploadDir, 'media');

[uploadDir, designsDir, invoicesDir, mediaDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created uploads directory: ${dir}`);
  }
});

// Serve static assets from the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import API routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const designRoutes = require('./routes/designRoutes');
const couponRoutes = require('./routes/couponRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const heroSlideRoutes = require('./routes/heroSlideRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const stickerRoutes = require('./routes/stickerRoutes');
const fabricColorRoutes = require('./routes/fabricColorRoutes');
const designSettingRoutes = require('./routes/designSettingRoutes');
const eventRoutes = require('./routes/eventRoutes'); // Global SSE real-time stream

// Selective API cache policy:
// - public catalog endpoints: short-lived cache to reduce repeated payload cost
// - auth/cart/order and other mutable endpoints: no-store for real-time correctness
app.use('/api', (req, res, next) => {
  const isReadOnlyCatalogRequest = req.method === 'GET' && (
    (req.path === '/products' || req.path === '/products/') ||
    req.path.startsWith('/categories') ||
    req.path.startsWith('/hero-slides') ||
    req.path.startsWith('/media')
  );

  if (isReadOnlyCatalogRequest) {
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    return next();
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/design', designRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/hero-slides', heroSlideRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/fabric-colors', fabricColorRoutes);
app.use('/api/design-settings', designSettingRoutes);
app.use('/api/events', eventRoutes); // Single global SSE stream for all real-time updates

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CustomWear BD API Server (Active & Online)',
    version: '1.0.0'
  });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Global Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred'
  });
});

// Database & Server port activation
const PORT = process.env.PORT || 5000;

const { seedDefaultCategories } = require('./controllers/categoryController');
const { seedDefaultStickers } = require('./controllers/stickerController');
const { seedDefaultFabricColors } = require('./controllers/fabricColorController');

connectDB().then(async () => {
  if (process.env.SEED_ON_BOOT === 'true') {
    await seedDefaultCategories();
    await seedDefaultStickers();
    await seedDefaultFabricColors();
  }
  app.listen(PORT, () => {
    console.log(`CustomWear API Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});
