import mongoose from "mongoose";
import { StaffFaceEmbedding } from "../modules/offlineFaceRecognition/models/StaffFaceEmbedding";

async function checkEmbeddings() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    const count = await StaffFaceEmbedding.countDocuments();
    console.log(`📊 Total Face Embeddings: ${count}`);

    if (count > 0) {
      const sample = await StaffFaceEmbedding.findOne().populate("staffId").lean();
      console.log(`\nSample Embedding:`);
      console.log(`  - ID: ${sample?._id}`);
      console.log(`  - Staff ID: ${(sample as any)?.staffId?._id}`);
      console.log(`  - Staff Name: ${(sample as any)?.staffId?.name}`);
      console.log(`  - Model: ${sample?.modelName}`);
      console.log(`  - Dimensions: ${sample?.embedding?.length}`);
      console.log(`  - Photo URL: ${sample?.photoUrl}`);
    }

    // Check collection name
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`\nAll collections in database:`);
      collections.forEach(c => console.log(`  - ${c.name}`));
    }

    await mongoose.disconnect();
    console.log("\n👋 Disconnected");
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkEmbeddings();
