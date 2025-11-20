"use strict";
/**
 * Check Database Records
 * Quick script to check User and Staff data
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
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../modules/user/models/User");
const Staff_1 = require("../modules/staff/models/Staff");
function checkDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/punchora";
            yield mongoose_1.default.connect(mongoUri);
            console.log("✅ Connected to MongoDB\n");
            // Check Users
            const userCount = yield User_1.User.countDocuments();
            console.log(`📊 Total Users: ${userCount}`);
            const usersWithPhotos = yield User_1.User.countDocuments({
                photos: { $exists: true, $ne: [] }
            });
            console.log(`📸 Users with photos: ${usersWithPhotos}`);
            if (usersWithPhotos > 0) {
                const sampleUser = yield User_1.User.findOne({ photos: { $exists: true, $ne: [] } }).lean();
                console.log(`\nSample User with photo:`);
                console.log(`  - ID: ${sampleUser === null || sampleUser === void 0 ? void 0 : sampleUser._id}`);
                console.log(`  - Name: ${sampleUser === null || sampleUser === void 0 ? void 0 : sampleUser.name}`);
                console.log(`  - Photos: ${JSON.stringify(sampleUser === null || sampleUser === void 0 ? void 0 : sampleUser.photos)}`);
            }
            // Check Staff
            const staffCount = yield Staff_1.Staff.countDocuments();
            console.log(`\n📊 Total Staff: ${staffCount}`);
            if (staffCount > 0) {
                const sampleStaff = yield Staff_1.Staff.findOne().populate("user").lean();
                console.log(`\nSample Staff:`);
                console.log(`  - ID: ${sampleStaff === null || sampleStaff === void 0 ? void 0 : sampleStaff._id}`);
                console.log(`  - Name: ${sampleStaff === null || sampleStaff === void 0 ? void 0 : sampleStaff.name}`);
                console.log(`  - UID: ${sampleStaff === null || sampleStaff === void 0 ? void 0 : sampleStaff.uid}`);
                console.log(`  - User ID: ${((_a = sampleStaff === null || sampleStaff === void 0 ? void 0 : sampleStaff.user) === null || _a === void 0 ? void 0 : _a._id) || (sampleStaff === null || sampleStaff === void 0 ? void 0 : sampleStaff.user)}`);
                console.log(`  - User Name: ${(_b = sampleStaff === null || sampleStaff === void 0 ? void 0 : sampleStaff.user) === null || _b === void 0 ? void 0 : _b.name}`);
                console.log(`  - User Photos: ${JSON.stringify((_c = sampleStaff === null || sampleStaff === void 0 ? void 0 : sampleStaff.user) === null || _c === void 0 ? void 0 : _c.photos)}`);
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
checkDatabase();
