/**
 * Migration Script: Convert User Photos to ONNX Face Embeddings
 *
 * This script:
 * 1. Scans all images in backend/public/users/
 * 2. Generates ONNX embeddings for each image
 * 3. Links embeddings to Staff records
 * 4. Stores in StaffFaceEmbedding collection
 *
 * Usage:
 *   npx ts-node src/scripts/migrateToOnnxEmbeddings.ts
 */

import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { OnnxFaceService } from "../modules/offlineFaceRecognition/services/OnnxFaceService";
import { StaffFaceEmbedding } from "../modules/offlineFaceRecognition/models/StaffFaceEmbedding";
import { Staff } from "../modules/staff/models/Staff";
import { User } from "../modules/user/models/User";

// Configuration
const IMAGES_DIR = path.join(__dirname, "../../public/users");
const BATCH_SIZE = 10; // Process 10 images at a time to avoid memory issues
const DRY_RUN = false; // Set to true to test without saving to DB

interface MigrationResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ filename: string; error: string }>;
}

interface ImageMapping {
  filename: string;
  fullPath: string;
  userId?: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  staffName?: string;
}

class OnnxEmbeddingMigration {
  private onnxService: OnnxFaceService;
  private results: MigrationResult = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  constructor() {
    this.onnxService = OnnxFaceService.getInstance();
  }

  /**
   * Connect to MongoDB
   */
  async connectDatabase(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
      await mongoose.connect(mongoUri);
      console.log("✅ Connected to MongoDB");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      throw error;
    }
  }

  /**
   * Initialize ONNX service
   */
  async initializeOnnx(): Promise<void> {
    try {
      await this.onnxService.initialize();
      console.log("✅ ONNX service initialized");
    } catch (error) {
      console.error("❌ ONNX initialization failed:", error);
      throw error;
    }
  }

  /**
   * Get all image files from directory
   */
  async getImageFiles(): Promise<string[]> {
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png"].includes(ext);
    });

    console.log(`📁 Found ${imageFiles.length} images in ${IMAGES_DIR}`);
    return imageFiles;
  }

  /**
   * Map images to staff members
   */
  async mapImagesToStaff(imageFiles: string[]): Promise<ImageMapping[]> {
    console.log("🔍 Mapping images to staff members...");

    const mappings: ImageMapping[] = [];

    // Get all users with photos
    const users = await User.find({ photos: { $exists: true, $ne: [] } }).lean();
    console.log(`👥 Found ${users.length} users with photos`);

    // Get all staff records
    const staffRecords = await Staff.find().populate("user").lean();
    console.log(`👔 Found ${staffRecords.length} staff records`);

    // Create a map of photo filenames to users
    const photoToUserMap = new Map<string, any>();
    for (const user of users) {
      if (user.photos && Array.isArray(user.photos)) {
        for (const photo of user.photos) {
          const filename = path.basename(photo);
          photoToUserMap.set(filename, user);
        }
      }
    }

    // Map each image file
    for (const filename of imageFiles) {
      const fullPath = path.join(IMAGES_DIR, filename);

      const user = photoToUserMap.get(filename);

      if (user) {
        // Find corresponding staff record
        const staff = staffRecords.find((s: any) =>
          s.user && s.user._id.toString() === user._id.toString()
        );

        mappings.push({
          filename,
          fullPath,
          userId: user._id,
          staffId: staff ? staff._id : undefined,
          staffName: staff ? staff.name : user.name,
        });
      } else {
        // Image exists but not linked to any user
        mappings.push({
          filename,
          fullPath,
        });
      }
    }

    const linked = mappings.filter((m) => m.staffId).length;
    const unlinked = mappings.filter((m) => !m.staffId).length;

    console.log(`✅ Linked to staff: ${linked}`);
    console.log(`⚠️  Not linked to staff: ${unlinked}`);

    return mappings;
  }

  /**
   * Process a single image
   */
  async processImage(mapping: ImageMapping): Promise<boolean> {
    try {
      // Check if embedding already exists
      if (mapping.staffId) {
        const existing = await StaffFaceEmbedding.findOne({
          staffId: mapping.staffId,
        });

        if (existing) {
          console.log(`⏭️  Skipping ${mapping.filename} - embedding already exists`);
          this.results.skipped++;
          return true;
        }
      }

      // Generate embedding
      console.log(`🔄 Processing ${mapping.filename}...`);
      const embedding = await this.onnxService.generateEmbedding(mapping.fullPath);

      if (!embedding || embedding.length !== 128) {
        throw new Error("Invalid embedding generated");
      }

      // Save to database (skip if staffId not found or DRY_RUN mode)
      if (DRY_RUN) {
        console.log(`✅ [DRY RUN] Would save embedding for ${mapping.filename}`);
        this.results.successful++;
        return true;
      }

      if (!mapping.staffId) {
        console.log(`⚠️  Skipping save for ${mapping.filename} - no staff record found`);
        this.results.skipped++;
        return true;
      }

      // Save embedding
      await StaffFaceEmbedding.create({
        staffId: mapping.staffId,
        modelName: "MobileFaceNet",
        embedding: embedding,
        embeddingVersion: "v1.0",
        photoUrl: `/users/${mapping.filename}`,
      });

      console.log(`✅ Saved embedding for ${mapping.staffName} (${mapping.filename})`);
      this.results.successful++;
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to process ${mapping.filename}:`, error.message);
      this.results.failed++;
      this.results.errors.push({
        filename: mapping.filename,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Process images in batches
   */
  async processBatch(mappings: ImageMapping[]): Promise<void> {
    this.results.total = mappings.length;

    for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
      const batch = mappings.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(mappings.length / BATCH_SIZE);

      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} images)`);

      // Process batch sequentially to avoid overwhelming the system
      for (const mapping of batch) {
        await this.processImage(mapping);
      }

      // Progress update
      const progress = ((i + batch.length) / mappings.length * 100).toFixed(1);
      console.log(`📊 Progress: ${progress}% (${i + batch.length}/${mappings.length})`);
    }
  }

  /**
   * Print summary report
   */
  printSummary(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total images:        ${this.results.total}`);
    console.log(`✅ Successful:       ${this.results.successful}`);
    console.log(`⏭️  Skipped:          ${this.results.skipped}`);
    console.log(`❌ Failed:           ${this.results.failed}`);
    console.log("=".repeat(60));

    if (this.results.errors.length > 0) {
      console.log("\n⚠️  ERRORS:");
      this.results.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.filename}: ${err.error}`);
      });
    }

    if (DRY_RUN) {
      console.log("\n⚠️  DRY RUN MODE - No data was saved to database");
    }
  }

  /**
   * Run the migration
   */
  async run(): Promise<void> {
    try {
      console.log("🚀 Starting ONNX Embedding Migration");
      console.log("=".repeat(60));

      // Step 1: Connect to database
      await this.connectDatabase();

      // Step 2: Initialize ONNX
      await this.initializeOnnx();

      // Step 3: Get all images
      const imageFiles = await this.getImageFiles();

      if (imageFiles.length === 0) {
        console.log("⚠️  No images found. Exiting.");
        return;
      }

      // Step 4: Map images to staff
      const mappings = await this.mapImagesToStaff(imageFiles);

      // Step 5: Process images
      await this.processBatch(mappings);

      // Step 6: Print summary
      this.printSummary();

      console.log("\n✅ Migration completed!");
    } catch (error: any) {
      console.error("\n❌ Migration failed:", error.message);
      throw error;
    } finally {
      // Cleanup
      await mongoose.disconnect();
      console.log("👋 Disconnected from MongoDB");
    }
  }
}

// Run migration if executed directly
if (require.main === module) {
  const migration = new OnnxEmbeddingMigration();

  migration.run()
    .then(() => {
      console.log("🎉 Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { OnnxEmbeddingMigration };
