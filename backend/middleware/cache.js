const { redisClient } = require('../config/db');

/**
 * Cache middleware for product endpoints
 */
const productCache = async (req, res, next) => {
  // Check if Redis client is ready
  if (!redisClient || !redisClient.isOpen) {
    return next();
  }

  // Create a unique cache key based on query filters and search terms
  const key = `products_cache:${req.originalUrl || req.url}`;

  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      // Serve direct from memory
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Override res.json to capture response payload
    const originalJson = res.json;
    res.json = function (body) {
      res.json = originalJson;
      // Only cache successful standard queries
      if (res.statusCode === 200 && body && body.success !== false) {
        redisClient.setEx(key, 300, JSON.stringify(body)); // Cache for 5 minutes (300 seconds)
      }
      return res.json(body);
    };

    next();
  } catch (error) {
    console.error('Redis product cache middleware error:', error.message);
    next();
  }
};

/**
 * Invalidates all keys matched by a pattern (e.g. products_cache:*)
 */
const invalidateProductCache = async () => {
  if (!redisClient || !redisClient.isOpen) {
    return;
  }

  try {
    const keys = await redisClient.keys('products_cache:*');
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Redis Cache Invalidated: Removed ${keys.length} cached list queries`);
    }
  } catch (error) {
    console.error('Redis cache invalidation error:', error.message);
  }
};

module.exports = { productCache, invalidateProductCache };
