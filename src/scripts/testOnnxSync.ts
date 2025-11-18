/**
 * Test ONNX Sync Functionality
 *
 * This script tests the /v1/offline-face/staff-embeddings endpoint
 * to diagnose sync issues
 *
 * Usage:
 *   npx ts-node src/scripts/testOnnxSync.ts
 */

import mongoose from "mongoose";
import { StaffFaceEmbedding } from "../modules/offlineFaceRecognition/models/StaffFaceEmbedding";
import { Staff } from "../modules/staff/models/Staff";

async function testSync() {
  try {
    console.log("🔍 Testing ONNX Sync Setup...\n");

    // Step 1: Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Step 2: Check Staff collection
    const staffCount = await Staff.countDocuments();
    console.log(`\n📊 Staff Records: ${staffCount}`);

    if (staffCount === 0) {
      console.log("⚠️  WARNING: No staff records found!");
      console.log("   You need to create staff records before generating embeddings.");
    } else {
      const sampleStaff = await Staff.findOne().lean();
      console.log(`   Sample staff: ${JSON.stringify(sampleStaff, null, 2)}`);
    }

    // Step 3: Check StaffFaceEmbedding collection
    const embeddingCount = await StaffFaceEmbedding.countDocuments();
    console.log(`\n📊 Face Embeddings: ${embeddingCount}`);

    if (embeddingCount === 0) {
      console.log("⚠️  WARNING: No face embeddings found!");
      console.log("   You need to run the migration script:");
      console.log("   npm run migrate:onnx");
    } else {
      const sampleEmbedding = await StaffFaceEmbedding.findOne()
        .populate("staffId", "name uid")
        .lean();
      console.log(`   Sample embedding:`);
      console.log(`   - Staff ID: ${(sampleEmbedding as any)?.staffId?._id}`);
      console.log(`   - Staff Name: ${(sampleEmbedding as any)?.staffId?.name}`);
      console.log(`   - Employee ID (uid): ${(sampleEmbedding as any)?.staffId?.uid}`);
      console.log(`   - Embedding dimensions: ${(sampleEmbedding as any)?.embedding?.length}`);
      console.log(`   - Photo URL: ${(sampleEmbedding as any)?.photoUrl}`);
    }

    // Step 4: Test the sync endpoint query
    console.log("\n🔬 Testing Sync Endpoint Query...");
    const embeddings = await StaffFaceEmbedding.find({})
      .populate("staffId", "name uid")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    if (embeddings.length === 0) {
      console.log("❌ Query returned no results");
    } else {
      console.log(`✅ Query returned ${embeddings.length} embeddings`);
      embeddings.forEach((e: any, idx) => {
        console.log(`\n   Embedding ${idx + 1}:`);
        console.log(`   - Staff ID: ${e.staffId?._id || "NULL"}`);
        console.log(`   - Staff Name: ${e.staffId?.name || "NULL"}`);
        console.log(`   - Employee ID: ${e.staffId?.uid || "NULL"}`);
        console.log(`   - Embedding size: ${e.embedding?.length || 0}`);
        console.log(`   - Photo URL: ${e.photoUrl}`);
      });
    }

    // Step 5: Simulate API response
    console.log("\n📤 Simulated API Response:");
    const data = embeddings.map((e: any) => ({
      id: e._id.toString(),
      staffId: e.staffId?._id?.toString() || "",
      staffName: e.staffId?.name || "Unknown",
      employeeId: e.staffId?.uid?.toString() || "",
      embedding: e.embedding,
      photoUrl: e.photoUrl,
      modelName: e.modelName,
      embeddingVersion: e.embeddingVersion,
      updatedAt: e.updatedAt.getTime(),
    }));

    console.log(JSON.stringify({
      success: true,
      data: data.slice(0, 2), // Show first 2
      pagination: {
        page: 1,
        limit: 50,
        total: embeddingCount,
        totalPages: Math.ceil(embeddingCount / 50),
        hasMore: embeddingCount > 50,
      },
    }, null, 2));

    // Step 6: Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Staff Records:      ${staffCount}`);
    console.log(`Face Embeddings:    ${embeddingCount}`);
    console.log("=".repeat(60));

    if (staffCount === 0) {
      console.log("\n❌ ISSUE: No staff records found");
      console.log("   ACTION: Create staff records in your system");
    }

    if (embeddingCount === 0) {
      console.log("\n❌ ISSUE: No face embeddings found");
      console.log("   ACTION: Run the migration script:");
      console.log("   cd backend && npm run migrate:onnx");
    }

    if (staffCount > 0 && embeddingCount > 0) {
      console.log("\n✅ Setup looks good! You can now test the mobile app sync.");
      console.log("\n📱 Mobile App Testing:");
      console.log("   1. Open pagar_lens app");
      console.log("   2. Trigger sync (call OfflineSync.downloadEmbeddings())");
      console.log("   3. Check console for sync results");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run test
if (require.main === module) {
  testSync()
    .then(() => {
      console.log("\n✅ Test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test failed:", error);
      process.exit(1);
    });
}

export { testSync };
