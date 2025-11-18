const mongoose = require("mongoose");

async function verify() {
  try {
    await mongoose.connect("mongodb://localhost:27017/punchora");
    console.log("✅ Connected\n");

    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("📋 All Collections:");
    collections.forEach(c => console.log(`   - ${c.name}`));

    // Count stafffaceembeddings
    const count = await db.collection('stafffaceembeddings').countDocuments();
    console.log(`\n📊 stafffaceembeddings count: ${count}`);

    // Show sample
    if (count > 0) {
      const sample = await db.collection('stafffaceembeddings').findOne();
      console.log(`\n✅ Sample embedding found:`);
      console.log(`   - _id: ${sample._id}`);
      console.log(`   - staffId: ${sample.staffId}`);
      console.log(`   - modelName: ${sample.modelName}`);
      console.log(`   - embedding length: ${sample.embedding?.length}`);
      console.log(`   - photoUrl: ${sample.photoUrl}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

verify();
