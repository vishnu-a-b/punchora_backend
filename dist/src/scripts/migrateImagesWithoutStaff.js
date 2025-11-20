"use strict";
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
exports.StandaloneImageMigration = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const OnnxFaceService_1 = require("../modules/offlineFaceRecognition/services/OnnxFaceService");
const StaffFaceEmbedding_1 = require("../modules/offlineFaceRecognition/models/StaffFaceEmbedding");
const Staff_1 = require("../modules/staff/models/Staff");
const User_1 = require("../modules/user/models/User");
const Department_1 = require("../modules/department/models/Department");
const Business_1 = require("../modules/business/models/Business");
const genders_1 = require("../modules/base/enums/genders");
const staffRoles_1 = require("../modules/base/enums/staffRoles");
const staffTypes_1 = require("../modules/base/enums/staffTypes");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const IMAGES_DIR = path_1.default.join(__dirname, "../../public/users");
const DRY_RUN = process.env.DRY_RUN === "true";
class StandaloneImageMigration {
    constructor() {
        this.results = {
            total: 0,
            successful: 0,
            failed: 0,
            errors: [],
        };
        this.onnxService = OnnxFaceService_1.OnnxFaceService.getInstance();
    }
    connectDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
            yield mongoose_1.default.connect(mongoUri);
            console.log("✅ Connected to MongoDB");
        });
    }
    initializeOnnx() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.onnxService.initialize();
            console.log("✅ ONNX service initialized");
        });
    }
    setupDefaults() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create default business if none exists
            this.defaultBusiness = yield Business_1.Business.findOne();
            if (!this.defaultBusiness) {
                this.defaultBusiness = yield Business_1.Business.create({
                    name: "Default Business",
                    type: "default",
                    isActive: true,
                });
                console.log("✅ Created default business");
            }
            // Create default department if none exists
            this.defaultDepartment = yield Department_1.Department.findOne();
            if (!this.defaultDepartment) {
                this.defaultDepartment = yield Department_1.Department.create({
                    name: "General",
                    business: this.defaultBusiness._id,
                    isActive: true,
                });
                console.log("✅ Created default department");
            }
        });
    }
    getImageFiles() {
        const files = fs_1.default.readdirSync(IMAGES_DIR);
        const imageFiles = files.filter((file) => {
            const ext = path_1.default.extname(file).toLowerCase();
            return [".jpg", ".jpeg", ".png"].includes(ext);
        });
        console.log(`📁 Found ${imageFiles.length} images in ${IMAGES_DIR}`);
        return imageFiles;
    }
    createStaffFromImage(filename, photoPath) {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract a name from filename (or use filename)
            const baseName = path_1.default.basename(filename, path_1.default.extname(filename));
            const staffName = `Staff ${baseName.substring(0, 10)}`;
            // Create a mobile number based on timestamp
            const timestamp = Date.now().toString();
            const mobileNo = `+1${timestamp.substring(timestamp.length - 10)}`;
            // Create User
            const hashedPassword = yield bcryptjs_1.default.hash("password123", 10);
            const user = yield User_1.User.create({
                name: staffName,
                mobileNo,
                password: hashedPassword,
                gender: genders_1.Genders.male, // Default
                photos: [`/users/${filename}`],
                isActive: true,
            });
            // Create Staff
            const staff = yield Staff_1.Staff.create({
                user: user._id,
                name: staffName,
                department: this.defaultDepartment._id,
                business: this.defaultBusiness._id,
                joinDate: new Date(),
                role: staffRoles_1.StaffRoles.regularStaff,
                type: staffTypes_1.StaffTypes.inside,
                isActive: true,
            });
            console.log(`   ✅ Created staff: ${staffName} (UID: ${staff.uid})`);
            return staff;
        });
    }
    processImage(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullPath = path_1.default.join(IMAGES_DIR, filename);
            try {
                console.log(`🔄 Processing ${filename}...`);
                // Generate embedding
                const embedding = yield this.onnxService.generateEmbedding(fullPath);
                if (!embedding || (embedding.length !== 128 && embedding.length !== 512)) {
                    throw new Error(`Invalid embedding generated (length: ${(embedding === null || embedding === void 0 ? void 0 : embedding.length) || 0})`);
                }
                if (DRY_RUN) {
                    console.log(`   ✅ [DRY RUN] Would create embedding`);
                    this.results.successful++;
                    return true;
                }
                // Create staff record for this image
                const staff = yield this.createStaffFromImage(filename, fullPath);
                // Create embedding
                const modelName = embedding.length === 512 ? "ArcFace" : "MobileFaceNet";
                yield StaffFaceEmbedding_1.StaffFaceEmbedding.create({
                    staffId: staff._id,
                    modelName,
                    embedding: embedding,
                    embeddingVersion: "v1.0",
                    photoUrl: `/users/${filename}`,
                });
                console.log(`   ✅ Created embedding for ${staff.name}`);
                this.results.successful++;
                return true;
            }
            catch (error) {
                console.error(`   ❌ Failed: ${error.message}`);
                this.results.failed++;
                this.results.errors.push({
                    filename,
                    error: error.message,
                });
                return false;
            }
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🚀 Starting Standalone Image Migration");
                console.log("=".repeat(60));
                if (DRY_RUN) {
                    console.log("⚠️  DRY RUN MODE - No data will be saved\n");
                }
                yield this.connectDatabase();
                yield this.initializeOnnx();
                yield this.setupDefaults();
                const imageFiles = this.getImageFiles();
                this.results.total = imageFiles.length;
                if (imageFiles.length === 0) {
                    console.log("⚠️  No images found. Exiting.");
                    return;
                }
                console.log(`\n📦 Processing ${imageFiles.length} images...\n`);
                for (const filename of imageFiles) {
                    yield this.processImage(filename);
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
            }
            catch (error) {
                console.error("\n❌ Migration failed:", error.message);
                throw error;
            }
            finally {
                yield mongoose_1.default.disconnect();
                console.log("👋 Disconnected from MongoDB");
            }
        });
    }
}
exports.StandaloneImageMigration = StandaloneImageMigration;
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
