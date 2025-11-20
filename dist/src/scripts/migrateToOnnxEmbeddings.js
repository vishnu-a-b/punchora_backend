"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnnxEmbeddingMigration = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const OnnxFaceService_1 = require("../modules/offlineFaceRecognition/services/OnnxFaceService");
const StaffFaceEmbedding_1 = require("../modules/offlineFaceRecognition/models/StaffFaceEmbedding");
const Staff_1 = require("../modules/staff/models/Staff");
const User_1 = require("../modules/user/models/User");
// Configuration
const IMAGES_DIR = path_1.default.join(__dirname, "../../public/users");
const BATCH_SIZE = 10; // Process 10 images at a time to avoid memory issues
const DRY_RUN = false; // Set to true to test without saving to DB
class OnnxEmbeddingMigration {
    constructor() {
        this.results = {
            total: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            errors: [],
        };
        this.onnxService = OnnxFaceService_1.OnnxFaceService.getInstance();
    }
    /**
     * Connect to MongoDB
     */
    connectDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
                yield mongoose_1.default.connect(mongoUri);
                console.log("✅ Connected to MongoDB");
            }
            catch (error) {
                console.error("❌ MongoDB connection failed:", error);
                throw error;
            }
        });
    }
    /**
     * Initialize ONNX service
     */
    initializeOnnx() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.onnxService.initialize();
                console.log("✅ ONNX service initialized");
            }
            catch (error) {
                console.error("❌ ONNX initialization failed:", error);
                throw error;
            }
        });
    }
    /**
     * Get all image files from directory
     */
    getImageFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = fs_1.default.readdirSync(IMAGES_DIR);
            const imageFiles = files.filter((file) => {
                const ext = path_1.default.extname(file).toLowerCase();
                return [".jpg", ".jpeg", ".png"].includes(ext);
            });
            console.log(`📁 Found ${imageFiles.length} images in ${IMAGES_DIR}`);
            return imageFiles;
        });
    }
    /**
     * Map images to staff members
     */
    mapImagesToStaff(imageFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("🔍 Mapping images to staff members...");
            const mappings = [];
            // Get all users with photos
            const users = yield User_1.User.find({ photos: { $exists: true, $ne: [] } }).lean();
            console.log(`👥 Found ${users.length} users with photos`);
            // Get all staff records
            const staffRecords = yield Staff_1.Staff.find().populate("user").lean();
            console.log(`👔 Found ${staffRecords.length} staff records`);
            // Create a map of photo filenames to users
            const photoToUserMap = new Map();
            for (const user of users) {
                if (user.photos && Array.isArray(user.photos)) {
                    for (const photo of user.photos) {
                        const filename = path_1.default.basename(photo);
                        photoToUserMap.set(filename, user);
                    }
                }
            }
            // Map each image file
            for (const filename of imageFiles) {
                const fullPath = path_1.default.join(IMAGES_DIR, filename);
                const user = photoToUserMap.get(filename);
                if (user) {
                    // Find corresponding staff record
                    const staff = staffRecords.find((s) => s.user && s.user._id.toString() === user._id.toString());
                    mappings.push({
                        filename,
                        fullPath,
                        userId: user._id,
                        staffId: staff ? staff._id : undefined,
                        staffName: staff ? staff.name : user.name,
                    });
                }
                else {
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
        });
    }
    /**
     * Process a single image
     */
    processImage(mapping) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if embedding already exists
                if (mapping.staffId) {
                    const existing = yield StaffFaceEmbedding_1.StaffFaceEmbedding.findOne({
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
                const embedding = yield this.onnxService.generateEmbedding(mapping.fullPath);
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
                yield StaffFaceEmbedding_1.StaffFaceEmbedding.create({
                    staffId: mapping.staffId,
                    modelName: "MobileFaceNet",
                    embedding: embedding,
                    embeddingVersion: "v1.0",
                    photoUrl: `/users/${mapping.filename}`,
                });
                console.log(`✅ Saved embedding for ${mapping.staffName} (${mapping.filename})`);
                this.results.successful++;
                return true;
            }
            catch (error) {
                console.error(`❌ Failed to process ${mapping.filename}:`, error.message);
                this.results.failed++;
                this.results.errors.push({
                    filename: mapping.filename,
                    error: error.message,
                });
                return false;
            }
        });
    }
    /**
     * Process images in batches
     */
    processBatch(mappings) {
        return __awaiter(this, void 0, void 0, function* () {
            this.results.total = mappings.length;
            for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
                const batch = mappings.slice(i, i + BATCH_SIZE);
                const batchNum = Math.floor(i / BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(mappings.length / BATCH_SIZE);
                console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} images)`);
                // Process batch sequentially to avoid overwhelming the system
                for (const mapping of batch) {
                    yield this.processImage(mapping);
                }
                // Progress update
                const progress = ((i + batch.length) / mappings.length * 100).toFixed(1);
                console.log(`📊 Progress: ${progress}% (${i + batch.length}/${mappings.length})`);
            }
        });
    }
    /**
     * Print summary report
     */
    printSummary() {
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
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🚀 Starting ONNX Embedding Migration");
                console.log("=".repeat(60));
                // Step 1: Connect to database
                yield this.connectDatabase();
                // Step 2: Initialize ONNX
                yield this.initializeOnnx();
                // Step 3: Get all images
                const imageFiles = yield this.getImageFiles();
                if (imageFiles.length === 0) {
                    console.log("⚠️  No images found. Exiting.");
                    return;
                }
                // Step 4: Map images to staff
                const mappings = yield this.mapImagesToStaff(imageFiles);
                // Step 5: Process images
                yield this.processBatch(mappings);
                // Step 6: Print summary
                this.printSummary();
                console.log("\n✅ Migration completed!");
            }
            catch (error) {
                console.error("\n❌ Migration failed:", error.message);
                throw error;
            }
            finally {
                // Cleanup
                yield mongoose_1.default.disconnect();
                console.log("👋 Disconnected from MongoDB");
            }
        });
    }
}
exports.OnnxEmbeddingMigration = OnnxEmbeddingMigration;
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
