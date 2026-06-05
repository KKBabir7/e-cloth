const mongoose = require('mongoose');
const redis = require('redis');
const { Queue } = require('bullmq');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    reconnectStrategy: () => {
      // Fail immediately if Redis is offline to avoid hanging server boot
      return new Error('Redis connection failed');
    }
  }
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Cache Client Connected'));

// BullMQ Queue for order processing
let orderQueue;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/customwear');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Connect Redis cache
    let isRedisAvailable = false;
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      isRedisAvailable = true;
      console.log('Redis Cache Client Connected successfully');
    } catch (redisError) {
      console.warn(`Redis Client Connection Warning: ${redisError.message}. App will run without Redis caching.`);
    }

    if (isRedisAvailable) {
      // Initialize BullMQ Queue using the Redis config
      const queueConnection = {
        host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : '127.0.0.1',
        port: process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || '6379') : 6379
      };
      
      orderQueue = new Queue('order-processing', {
        connection: queueConnection
      });
      console.log('BullMQ Order Queue Initialized');
    } else {
      orderQueue = null;
      console.log('BullMQ Order Queue bypassed (Redis is offline)');
    }
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  redisClient,
  getOrderQueue: () => orderQueue
};
