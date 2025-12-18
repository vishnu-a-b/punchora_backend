import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}`;

async function runAttendanceEnhancementsMigration() {
  console.log("Starting Attendance Enhancements Migration...\n");

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }

  const attendancesCollection = db.collection('attendances');

  // Step 1: Add default value for flagged field
  console.log("1. Setting default flagged=false for existing records...");
  const updateResult = await attendancesCollection.updateMany(
    { flagged: { $exists: false } },
    { $set: { flagged: false } }
  );
  console.log(`   Updated ${updateResult.modifiedCount} records\n`);

  // Step 2: Create indexes
  console.log("2. Creating indexes...");

  try {
    await attendancesCollection.createIndex({ staff: 1, date: 1 });
    console.log("   ✓ Created index: { staff: 1, date: 1 }");
  } catch (e: any) {
    console.log(`   ⚠ Index already exists or error: ${e.message}`);
  }

  try {
    await attendancesCollection.createIndex(
      { idempotencyKey: 1 },
      { sparse: true, unique: true }
    );
    console.log("   ✓ Created index: { idempotencyKey: 1 } (unique, sparse)");
  } catch (e: any) {
    console.log(`   ⚠ Index already exists or error: ${e.message}`);
  }

  try {
    await attendancesCollection.createIndex({ flagged: 1 });
    console.log("   ✓ Created index: { flagged: 1 }");
  } catch (e: any) {
    console.log(`   ⚠ Index already exists or error: ${e.message}`);
  }

  // Step 3: Verify migration
  console.log("\n3. Verification:");
  const totalRecords = await attendancesCollection.countDocuments({});
  const flaggedRecords = await attendancesCollection.countDocuments({ flagged: true });
  const unflaggedRecords = await attendancesCollection.countDocuments({ flagged: false });

  console.log(`   Total attendance records: ${totalRecords}`);
  console.log(`   Flagged records: ${flaggedRecords}`);
  console.log(`   Unflagged records: ${unflaggedRecords}`);

  // List all indexes
  console.log("\n4. Current indexes on attendances collection:");
  const indexes = await attendancesCollection.indexes();
  indexes.forEach(index => {
    const keyStr = JSON.stringify(index.key);
    const unique = index.unique ? '(unique)' : '';
    const sparse = index.sparse ? '(sparse)' : '';
    console.log(`   - ${keyStr} ${unique} ${sparse}`);
  });

  console.log("\n✓ Migration completed successfully!");
}

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    await runAttendanceEnhancementsMigration();

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
    process.exit(0);
  }
}

main();
