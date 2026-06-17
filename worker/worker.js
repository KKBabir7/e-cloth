const { Worker } = require('bullmq');
const dns = require('dns');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Some local/ISP DNS resolvers refuse MongoDB Atlas SRV lookups.
// Use reliable public DNS servers for worker-side Mongoose connections.
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Mongoose Models
const Order = require('../backend/models/Order');
const Product = require('../backend/models/Product');
const User = require('../backend/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/customwear')
  .then(() => console.log('Worker MongoDB Connected successfully'))
  .catch(err => console.error('Worker MongoDB Connection Error:', err));

// Connection parameters for BullMQ (Redis)
const redisConnection = {
  host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : '127.0.0.1',
  port: process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || '6379') : 6379
};

/**
 * PDF Invoice generator using pdfkit
 */
const generateInvoicePDF = (order, user, productsList, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);

      // --- PDF Styling ---
      // Primary colors: Navy Blue (#0F172A) & Crimson Red (#DC2626)
      
      // Header
      doc.fillColor('#0F172A').fontSize(26).text('CUSTOMWEAR BD', { bold: true });
      doc.fillColor('#DC2626').fontSize(10).text('BD\'s Finest Custom Apparel Platform', { characterSpacing: 1 });
      doc.moveDown(1.5);

      // Metas
      doc.fillColor('#0F172A').fontSize(11).text(`Invoice Number: ${order.orderId}`, { align: 'right' });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-BD')}`, { align: 'right' });
      doc.text(`Payment Method: ${order.paymentMethod}`, { align: 'right' });
      doc.text(`Payment Status: ${order.paymentStatus}`, { align: 'right' });
      doc.moveDown(1);

      // Customer Details
      doc.fillColor('#1E293B').fontSize(12).text('BILL TO:', { bold: true });
      doc.fontSize(11).text(`Name: ${order.shippingAddress.name}`);
      doc.text(`Phone: ${order.shippingAddress.phone}`);
      doc.text(`Address: ${order.shippingAddress.addressLine}, ${order.shippingAddress.area}, ${order.shippingAddress.district}`);
      doc.moveDown(2);

      // Items Table Header
      doc.fillColor('#0F172A').fontSize(12).text('ORDER ITEMS', { bold: true });
      doc.text('------------------------------------------------------------------------------------------------------');
      
      let itemY = doc.y + 10;
      doc.fontSize(10);
      doc.text('Item Details', 50, itemY);
      doc.text('Size', 280, itemY);
      doc.text('Qty', 350, itemY);
      doc.text('Unit Price', 410, itemY);
      doc.text('Subtotal', 490, itemY);
      
      doc.text('------------------------------------------------------------------------------------------------------', 50, itemY + 12);
      
      let currentY = itemY + 25;
      
      // Render Items
      order.products.forEach((item, index) => {
        const productDetails = productsList[index] || { name: 'Custom Apparel Shirt' };
        doc.text(productDetails.name, 50, currentY, { width: 220 });
        doc.text(item.size, 280, currentY);
        doc.text(item.quantity.toString(), 350, currentY);
        doc.text(`৳${item.price}`, 410, currentY);
        doc.text(`৳${item.price * item.quantity}`, 490, currentY);
        
        currentY += doc.heightOfString(productDetails.name, { width: 220 }) + 15;
      });

      doc.text('------------------------------------------------------------------------------------------------------', 50, currentY);
      currentY += 15;

      // Summary
      doc.fontSize(11);
      doc.text('Delivery Charge:', 350, currentY);
      doc.text(`৳${order.deliveryCharge}`, 490, currentY);
      
      currentY += 20;
      doc.text('Discount Applied:', 350, currentY);
      doc.text(`-৳${order.discountAmount}`, 490, currentY);
      
      currentY += 20;
      doc.fillColor('#DC2626').text('Grand Total:', 350, currentY, { bold: true });
      doc.text(`৳${order.totalAmount}`, 490, currentY, { bold: true });

      // Footer
      doc.fillColor('#64748B').fontSize(9).text(
        'Thank you for shopping with CustomWear BD! For exchanges or support, contact +8801999999999.',
        50,
        740,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        resolve();
      });
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
};

// Initialize BullMQ Worker
const worker = new Worker('order-processing', async (job) => {
  console.log(`\n--- Starting processing for job: ${job.id} (Order: ${job.data.orderId}) ---`);
  
  const { orderDbId, orderId, userId, products, paymentMethod, paymentDetails } = job.data;
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Retrieve full order & user profiles
    const order = await Order.findById(orderDbId).session(session);
    if (!order) {
      throw new Error(`Order ${orderId} not found in DB`);
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error(`User ${userId} not found in DB`);
    }

    // 2. Validate Inventory & Decrement stock safely
    const productsList = [];
    for (const item of products) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        // Insufficient stock flow
        console.error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Ordered: ${item.quantity}`);
        order.status = 'Cancelled';
        order.paymentStatus = 'Failed';
        await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        
        // Return alert representing notification
        console.log(`[ALERT] Sent SMS to ${order.shippingAddress.phone}: "Order ${orderId} was cancelled due to stock limits. Refunds will process within 2 days."`);
        return { success: false, message: 'Stock unavailable, order cancelled' };
      }

      // Decrement stock levels
      product.stock -= item.quantity;
      await product.save({ session });
      productsList.push(product);
    }

    // 3. Payment Processing Integration Simulator
    if (paymentMethod === 'bKash' || paymentMethod === 'Nagad') {
      console.log(`Simulating Mobile Payment Verification for ${paymentMethod} (Txn: ${paymentDetails.transactionId})...`);
      
      // Simulate direct bank gateway delay
      await new Promise(r => setTimeout(r, 1200));

      if (paymentDetails.transactionId === 'FAIL') {
        // Simulated failure injection for manual verification
        order.status = 'Cancelled';
        order.paymentStatus = 'Failed';
        await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        
        console.log(`[ALERT] bKash/Nagad verification failed for txn: ${paymentDetails.transactionId}`);
        return { success: false, message: 'Mobile gateway transaction validation failed' };
      }

      // Successful transaction
      order.paymentStatus = 'Paid';
      order.paymentDetails.paidAt = new Date();
    } else {
      // Cash on Delivery
      order.paymentStatus = 'Pending';
    }

    order.status = 'Processing';

    // Commit inventory adjustments and payment records
    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    // 4. Generate High-Premium Invoice PDF
    const invoicesPath = path.join(__dirname, '../backend/uploads/invoices');
    if (!fs.existsSync(invoicesPath)) {
      fs.mkdirSync(invoicesPath, { recursive: true });
    }
    const pdfFileName = `${orderId}-invoice.pdf`;
    const pdfFilePath = path.join(invoicesPath, pdfFileName);

    await generateInvoicePDF(order, user, productsList, pdfFilePath);
    console.log(`Invoice PDF Generated successfully at: ${pdfFilePath}`);

    // Update order with static file link
    order.invoicePath = `/uploads/invoices/${pdfFileName}`;
    await order.save();

    // 5. Mock Email & WhatsApp API Dispatch
    console.log(`\n========================================`);
    console.log(`[NOTIFY DISPATCH]`);
    console.log(`To Customer: ${user.email} | Phone: ${order.shippingAddress.phone}`);
    console.log(`Subject: Your Order ${orderId} is confirmed!`);
    console.log(`SMS: "Hello ${order.shippingAddress.name}, your CustomWear order ${orderId} has been successfully validated. Total BDT ৳${order.totalAmount}. Track details in your Account panel."`);
    console.log(`Attachment: ${order.invoicePath}`);
    console.log(`========================================\n`);

    console.log(`Job processing finished successfully for: ${orderId}`);
    return { success: true, orderId: orderId, invoice: order.invoicePath };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error(`Error processing job ${job.id}:`, error.message);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 5
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

worker.on('error', (err) => {
  console.error(`BullMQ Worker connection error: ${err.message}. Retrying...`);
});

console.log('BullMQ Order Processing Worker is listening for jobs on Redis...');
