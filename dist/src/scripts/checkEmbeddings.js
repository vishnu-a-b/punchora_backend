"use strict";
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
const mongoose_1 = __importDefault(require("mongoose"));
const StaffFaceEmbedding_1 = require("../modules/offlineFaceRecognition/models/StaffFaceEmbedding");
function checkEmbeddings() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
            yield mongoose_1.default.connect(mongoUri);
            console.log("✅ Connected to MongoDB\n");
            const count = yield StaffFaceEmbedding_1.StaffFaceEmbedding.countDocuments();
            console.log(`📊 Total Face Embeddings: ${count}`);
            if (count > 0) {
                const sample = yield StaffFaceEmbedding_1.StaffFaceEmbedding.findOne().populate("staffId").lean();
                console.log(`\nSample Embedding:`);
                console.log(`  - ID: ${sample === null || sample === void 0 ? void 0 : sample._id}`);
                console.log(`  - Staff ID: ${(_a = sample === null || sample === void 0 ? void 0 : sample.staffId) === null || _a === void 0 ? void 0 : _a._id}`);
                console.log(`  - Staff Name: ${(_b = sample === null || sample === void 0 ? void 0 : sample.staffId) === null || _b === void 0 ? void 0 : _b.name}`);
                console.log(`  - Model: ${sample === null || sample === void 0 ? void 0 : sample.modelName}`);
                console.log(`  - Dimensions: ${(_c = sample === null || sample === void 0 ? void 0 : sample.embedding) === null || _c === void 0 ? void 0 : _c.length}`);
                console.log(`  - Photo URL: ${sample === null || sample === void 0 ? void 0 : sample.photoUrl}`);
            }
            // Check collection name
            if (mongoose_1.default.connection.db) {
                const collections = yield mongoose_1.default.connection.db.listCollections().toArray();
                console.log(`\nAll collections in database:`);
                collections.forEach(c => console.log(`  - ${c.name}`));
            }
            yield mongoose_1.default.disconnect();
            console.log("\n👋 Disconnected");
        }
        catch (error) {
            console.error("Error:", error.message);
            process.exit(1);
        }
    });
}
checkEmbeddings();
