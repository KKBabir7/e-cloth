/**
 * removeDuplicateProducts.js
 * Finds and removes duplicate products (by name) keeping the oldest one.
 * Usage: node removeDuplicateProducts.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env — please set it and retry.');
  process.exit(1);
}

async function removeDuplicates() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('products');

  // Find all products, group by lowercase name
  const allProducts = await collection
    .find({}, { projection: { _id: 1, name: 1, createdAt: 1 } })
    .sort({ createdAt: 1 }) // oldest first
    .toArray();

  console.log(`📦 Total products found: ${allProducts.length}`);

  // Group by normalized name
  const groups = {};
  for (const p of allProducts) {
    const key = (p.name || '').trim().toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  // Find duplicates
  const duplicateNames = Object.entries(groups).filter(([, docs]) => docs.length > 1);

  if (duplicateNames.length === 0) {
    console.log('✅ No duplicate products found!');
    await mongoose.disconnect();
    return;
  }

  console.log(`\n⚠️  Found ${duplicateNames.length} product name(s) with duplicates:\n`);

  let totalDeleted = 0;

  for (const [name, docs] of duplicateNames) {
    // Keep the first (oldest), delete the rest
    const toKeep = docs[0];
    const toDelete = docs.slice(1);

    console.log(`  📌 "${docs[0].name}" — ${docs.length} copies`);
    console.log(`     Keeping  : ${toKeep._id} (created: ${toKeep.createdAt || 'N/A'})`);

    for (const doc of toDelete) {
      console.log(`     Deleting : ${doc._id} (created: ${doc.createdAt || 'N/A'})`);
      await collection.deleteOne({ _id: doc._id });
      totalDeleted++;
    }
  }

  console.log(`\n✅ Done! Deleted ${totalDeleted} duplicate product(s).`);
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

removeDuplicates().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
