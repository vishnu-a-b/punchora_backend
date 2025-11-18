/**
 * Standalone Image to ONNX Migration
 *
 * This script processes ALL images in backend/public/users/
 * and creates embeddings WITHOUT requiring existing Staff records
 *
 * It creates minimal Staff records automatically based on image filenames
 *
 * Usage:
 *   npx ts-node src/scripts/migrateImagesWithoutStaff.ts
 */

import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { OnnxFaceService } from "../modules/offlineFaceRecognition/services/OnnxFaceService";
import { StaffFaceEmbedding } from "../modules/offlineFaceRecognition/models/StaffFaceEmbedding";
import { Staff } from "../modules/staff/models/Staff";
import { User } from "../modules/user/models/User";
import { Department } from "../modules/department/models/Department";
import { Business } from "../modules/business/models/Business";
import { Genders } from "../modules/base/enums/genders";
import { StaffRoles } from "../modules/base/enums/staffRoles";
import { StaffTypes } from "../modules/base/enums/staffTypes";
import bcrypt from "bcryptjs";

const IMAGES_DIR = path.join(__dirname, "../../public/users");
const DRY_RUN = process.env.DRY_RUN === "true";

interface MigrationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ filename: string; error: string }>;
}

class StandaloneImageMigration {
  private onnxService: OnnxFaceService;
  private results: MigrationResult = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };
  private defaultDepartment: any;
  private defaultBusiness: any;

  constructor() {
    this.onnxService = OnnxFaceService.getInstance();
  }

  async connectDatabase(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
  }

  async initializeOnnx(): Promise<void> {
    await this.onnxService.initialize();
    console.log("✅ ONNX service initialized");
  }

  async setupDefaults(): Promise<void> {
    // Create default business if none exists
    this.defaultBusiness = await Business.findOne();
    if (!this.defaultBusiness) {
      this.defaultBusiness = await Business.create({
        name: "Default Business",
        type: "default",
        isActive: true,
      });
      console.log("✅ Created default business");
    }

    // Create default department if none exists
    this.defaultDepartment = await Department.findOne();
    if (!this.defaultDepartment) {
      this.defaultDepartment = await Department.create({
        name: "General",
        business: this.defaultBusiness._id,
        isActive: true,
      });
      console.log("✅ Created default department");
    }
  }

  getImageFiles(): string[] {
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png"].includes(ext);
    });
    console.log(`📁 Found ${imageFiles.length} images in ${IMAGES_DIR}`);
    return imageFiles;
  }

  async createStaffFromImage(filename: string, photoPath: string): Promise<any> {
    // Extract a name from filename (or use filename)
    const baseName = path.basename(filename, path.extname(filename));
    const staffName = `Staff ${baseName.substring(0, 10)}`;

    // Create a mobile number based on timestamp
    const timestamp = Date.now().toString();
    const mobileNo = `+1${timestamp.substring(timestamp.length - 10)}`;

    // Create User
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: staffName,
      mobileNo,
      password: hashedPassword,
      gender: Genders.male, // Default
      photos: [`/users/${filename}`],
      isActive: true,
    });

    // Create Staff
    const staff = await Staff.create({
      user: user._id,
      name: staffName,
      department: this.defaultDepartment._id,
      business: this.defaultBusiness._id,
      joinDate: new Date(),
      role: StaffRoles.regularStaff,
      type: StaffTypes.inside,
      isActive: true,
    });

    console.log(`   ✅ Created staff: ${staffName} (UID: ${staff.uid})`);
    return staff;
  }

  async processImage(filename: string): Promise<boolean> {
    const fullPath = path.join(IMAGES_DIR, filename);

    try {
      console.log(`🔄 Processing ${filename}...`);

      // Generate embedding
      const embedding = await this.onnxService.generateEmbedding(fullPath);

      if (!embedding || (embedding.length !== 128 && embedding.length !== 512)) {
        throw new Error(`Invalid embedding generated (length: ${embedding?.length || 0})`);
      }

      if (DRY_RUN) {
        console.log(`   ✅ [DRY RUN] Would create embedding`);
        this.results.successful++;
        return true;
      }

      // Create staff record for this image
      const staff = await this.createStaffFromImage(filename, fullPath);

      // Create embedding
      const modelName = embedding.length === 512 ? "ArcFace" : "MobileFaceNet";
      await StaffFaceEmbedding.create({
        staffId: staff._id,
        modelName,
        embedding: embedding,
        embeddingVersion: "v1.0",
        photoUrl: `/users/${filename}`,
      });

      console.log(`   ✅ Created embedding for ${staff.name}`);
      this.results.successful++;
      return true;
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({
        filename,
        error: error.message,
      });
      return false;
    }
  }

  async run(): Promise<void> {
    try {
      console.log("🚀 Starting Standalone Image Migration");
      console.log("=".repeat(60));

      if (DRY_RUN) {
        console.log("⚠️  DRY RUN MODE - No data will be saved\n");
      }

      await this.connectDatabase();
      await this.initializeOnnx();
      await this.setupDefaults();

      const imageFiles = this.getImageFiles();
      this.results.total = imageFiles.length;

      if (imageFiles.length === 0) {
        console.log("⚠️  No images found. Exiting.");
        return;
      }

      console.log(`\n📦 Processing ${imageFiles.length} images...\n`);

      for (const filename of imageFiles) {
        await this.processImage(filename);
      }

      // Print summary
      console.log("\n" + "=".repeat(60));
      console.log("📊 MIGRATION SUMMARY");
      console.log("=".repeat(60));
      console.log(`Total images:        ${this.results.total}`);
      console.log(`✅ Successful:       ${this.results.successful}`);
      console.log(`❌ Failed:           ${this.results.failed}`);
      console.log("=".repeat(60));

      if (this.results.errors.length > 0) {
        console.log("\n⚠️  ERRORS:");
        this.results.errors.forEach((err, idx) => {
          console.log(`  ${idx + 1}. ${err.filename}: ${err.error}`);
        });
      }

      if (DRY_RUN) {
        console.log("\n⚠️  DRY RUN MODE - No data was saved");
      }

      console.log("\n✅ Migration completed!");
    } catch (error: any) {
      console.error("\n❌ Migration failed:", error.message);
      throw error;
    } finally {
      await mongoose.disconnect();
      console.log("👋 Disconnected from MongoDB");
    }
  }
}

// Run migration
if (require.main === module) {
  const migration = new StandaloneImageMigration();

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

export { StandaloneImageMigration };
