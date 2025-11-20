"use strict";
/**
 * Test ONNX Sync Functionality
 *
 * This script tests the /v1/offline-face/staff-embeddings endpoint
 * to diagnose sync issues
 *
 * Usage:
 *   npx ts-node src/scripts/testOnnxSync.ts
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
exports.testSync = testSync;
const mongoose_1 = __importDefault(require("mongoose"));
const StaffFaceEmbedding_1 = require("../modules/offlineFaceRecognition/models/StaffFaceEmbedding");
const Staff_1 = require("../modules/staff/models/Staff");
function testSync() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            console.log("🔍 Testing ONNX Sync Setup...\n");
            // Step 1: Connect to MongoDB
            const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
            yield mongoose_1.default.connect(mongoUri);
            console.log("✅ Connected to MongoDB");
            // Step 2: Check Staff collection
            const staffCount = yield Staff_1.Staff.countDocuments();
            console.log(`\n📊 Staff Records: ${staffCount}`);
            if (staffCount === 0) {
                console.log("⚠️  WARNING: No staff records found!");
                console.log("   You need to create staff records before generating embeddings.");
            }
            else {
                const sampleStaff = yield Staff_1.Staff.findOne().lean();
                console.log(`   Sample staff: ${JSON.stringify(sampleStaff, null, 2)}`);
            }
            // Step 3: Check StaffFaceEmbedding collection
            const embeddingCount = yield StaffFaceEmbedding_1.StaffFaceEmbedding.countDocuments();
            console.log(`\n📊 Face Embeddings: ${embeddingCount}`);
            if (embeddingCount === 0) {
                console.log("⚠️  WARNING: No face embeddings found!");
                console.log("   You need to run the migration script:");
                console.log("   npm run migrate:onnx");
            }
            else {
                const sampleEmbedding = yield StaffFaceEmbedding_1.StaffFaceEmbedding.findOne()
                    .populate("staffId", "name uid")
                    .lean();
                console.log(`   Sample embedding:`);
                console.log(`   - Staff ID: ${(_a = sampleEmbedding === null || sampleEmbedding === void 0 ? void 0 : sampleEmbedding.staffId) === null || _a === void 0 ? void 0 : _a._id}`);
                console.log(`   - Staff Name: ${(_b = sampleEmbedding === null || sampleEmbedding === void 0 ? void 0 : sampleEmbedding.staffId) === null || _b === void 0 ? void 0 : _b.name}`);
                console.log(`   - Employee ID (uid): ${(_c = sampleEmbedding === null || sampleEmbedding === void 0 ? void 0 : sampleEmbedding.staffId) === null || _c === void 0 ? void 0 : _c.uid}`);
                console.log(`   - Embedding dimensions: ${(_d = sampleEmbedding === null || sampleEmbedding === void 0 ? void 0 : sampleEmbedding.embedding) === null || _d === void 0 ? void 0 : _d.length}`);
                console.log(`   - Photo URL: ${sampleEmbedding === null || sampleEmbedding === void 0 ? void 0 : sampleEmbedding.photoUrl}`);
            }
            // Step 4: Test the sync endpoint query
            console.log("\n🔬 Testing Sync Endpoint Query...");
            const embeddings = yield StaffFaceEmbedding_1.StaffFaceEmbedding.find({})
                .populate("staffId", "name uid")
                .sort({ updatedAt: -1 })
                .limit(5)
                .lean();
            if (embeddings.length === 0) {
                console.log("❌ Query returned no results");
            }
            else {
                console.log(`✅ Query returned ${embeddings.length} embeddings`);
                embeddings.forEach((e, idx) => {
                    var _a, _b, _c, _d;
                    console.log(`\n   Embedding ${idx + 1}:`);
                    console.log(`   - Staff ID: ${((_a = e.staffId) === null || _a === void 0 ? void 0 : _a._id) || "NULL"}`);
                    console.log(`   - Staff Name: ${((_b = e.staffId) === null || _b === void 0 ? void 0 : _b.name) || "NULL"}`);
                    console.log(`   - Employee ID: ${((_c = e.staffId) === null || _c === void 0 ? void 0 : _c.uid) || "NULL"}`);
                    console.log(`   - Embedding size: ${((_d = e.embedding) === null || _d === void 0 ? void 0 : _d.length) || 0}`);
                    console.log(`   - Photo URL: ${e.photoUrl}`);
                });
            }
            // Step 5: Simulate API response
            console.log("\n📤 Simulated API Response:");
            const data = embeddings.map((e) => {
                var _a, _b, _c, _d, _e;
                return ({
                    id: e._id.toString(),
                    staffId: ((_b = (_a = e.staffId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || "",
                    staffName: ((_c = e.staffId) === null || _c === void 0 ? void 0 : _c.name) || "Unknown",
                    employeeId: ((_e = (_d = e.staffId) === null || _d === void 0 ? void 0 : _d.uid) === null || _e === void 0 ? void 0 : _e.toString()) || "",
                    embedding: e.embedding,
                    photoUrl: e.photoUrl,
                    modelName: e.modelName,
                    embeddingVersion: e.embeddingVersion,
                    updatedAt: e.updatedAt.getTime(),
                });
            });
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
        }
        catch (error) {
            console.error("\n❌ Error:", error.message);
            throw error;
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log("\n👋 Disconnected from MongoDB");
        }
    });
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
