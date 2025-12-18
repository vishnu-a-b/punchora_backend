/**
 * Migration: Attendance Enhancements
 * Date: 2025-12-17
 *
 * This migration adds:
 * 1. New indexes for performance
 * 2. Default values for flagged field
 * 3. Idempotency key index
 */

// Run this script using MongoDB shell or a migration tool

// MongoDB Migration Script
db = db.getSiblingDB('s_hrms'); // Use your database name

print("Starting Attendance Enhancements Migration...");

// Step 1: Add default value for flagged field to existing records
print("\n1. Setting default flagged=false for existing records...");
const updateResult = db.attendances.updateMany(
  { flagged: { $exists: false } },
  { $set: { flagged: false } }
);
print(`   Updated ${updateResult.modifiedCount} records`);

// Step 2: Create indexes for better performance
print("\n2. Creating indexes...");

// Index for staff and date queries (faster duplicate detection)
try {
  db.attendances.createIndex({ staff: 1, date: 1 });
  print("   ✓ Created index: { staff: 1, date: 1 }");
} catch (e) {
  print(`   ⚠ Index already exists or error: ${e.message}`);
}

// Index for idempotencyKey (unique, sparse)
try {
  db.attendances.createIndex(
    { idempotencyKey: 1 },
    { sparse: true, unique: true }
  );
  print("   ✓ Created index: { idempotencyKey: 1 } (unique, sparse)");
} catch (e) {
  print(`   ⚠ Index already exists or error: ${e.message}`);
}

// Index for flagged records (for admin queries)
try {
  db.attendances.createIndex({ flagged: 1 });
  print("   ✓ Created index: { flagged: 1 }");
} catch (e) {
  print(`   ⚠ Index already exists or error: ${e.message}`);
}

// Step 3: Verify migration
print("\n3. Verification:");
const totalRecords = db.attendances.countDocuments({});
const flaggedRecords = db.attendances.countDocuments({ flagged: true });
const unflaggedRecords = db.attendances.countDocuments({ flagged: false });

print(`   Total attendance records: ${totalRecords}`);
print(`   Flagged records: ${flaggedRecords}`);
print(`   Unflagged records: ${unflaggedRecords}`);

// List all indexes
print("\n4. Current indexes on attendances collection:");
db.attendances.getIndexes().forEach(index => {
  print(`   - ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''} ${index.sparse ? '(sparse)' : ''}`);
});

print("\n✓ Migration completed successfully!");
print("\nNote: The idempotencyKey index is sparse, meaning documents without this field won't be indexed.");
print("This ensures backward compatibility with existing records.");
