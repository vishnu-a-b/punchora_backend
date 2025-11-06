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
exports.Staff = exports.staffFilterFields = exports.StaffShiftTypes = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const staffRoles_1 = require("../../base/enums/staffRoles");
const User_1 = require("../../user/models/User");
const staffTypes_1 = require("../../base/enums/staffTypes");
exports.StaffShiftTypes = {
    HOUR_BASE: "hour base",
    SINGLE_SHIFT: "single shift",
    MULTI_SHIFT: "multi shift",
    NO_TIMING: "no timing",
};
// Define interface for shift entry
const shiftEntrySchema = new mongoose_1.default.Schema({
    startTime: { type: Date, required: true },
    minutesWorked: { type: Number, required: true, min: 0 },
});
const staffSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, maxLength: 200, required: true },
    uid: { type: Number },
    department: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
    },
    business: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
    },
    designation: { type: String, maxLength: 200 },
    joinDate: {
        type: Date,
        required: true,
    },
    role: {
        type: String,
        required: true,
        maxLength: 20,
        enum: Object.values(staffRoles_1.StaffRoles),
    },
    type: {
        type: String,
        required: true,
        maxLength: 20,
        default: staffTypes_1.StaffTypes.inside,
        enum: Object.values(staffTypes_1.StaffTypes),
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    salary: { type: Number },
    createdBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    shiftType: {
        type: String,
        enum: Object.values(exports.StaffShiftTypes),
        default: exports.StaffShiftTypes.SINGLE_SHIFT,
    },
    hoursWorked: {
        type: Number,
        default: 0,
        min: 0,
        description: "Total minutes worked",
    },
    shifts: {
        type: [shiftEntrySchema],
        default: [],
    },
}, { timestamps: true });
staffSchema.pre("validate", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!this.name) {
                const patient = yield User_1.User.findById(this.user.toString());
                if (patient)
                    this.name = patient === null || patient === void 0 ? void 0 : patient.name;
            }
            const prevStaffs = yield exports.Staff.find().sort({ createdAt: -1 });
            if (prevStaffs && prevStaffs.length > 0) {
                this.uid = (_a = prevStaffs[0].uid) !== null && _a !== void 0 ? _a : 100 + 1;
            }
            else {
                this.uid = 101;
            }
            next();
        }
        catch (e) {
            next(e);
        }
    });
});
exports.staffFilterFields = {
    filterFields: [
        "user",
        "department",
        "business",
        "designation",
        "uid",
        "isActive",
    ],
    searchFields: ["registrationNo", "name"],
    sortFields: ["createdAt", "updatedAt", "registrationDate"],
};
exports.Staff = mongoose_1.default.model("Staff", staffSchema);
