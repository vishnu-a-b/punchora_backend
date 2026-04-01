"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.userFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const genders_1 = require("../../base/enums/genders");
const maritalStatuses_1 = require("../../base/enums/maritalStatuses");
const userSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, unique: false, maxLength: 100 },
    mobileNo: { type: String, required: true, unique: true, maxLength: 20 },
    password: { type: String, required: true, maxLength: 150, select: false },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    photos: [{ type: String, maxLength: 200 }],
    profilePicture: { type: String },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function (value) {
                return value <= new Date();
            },
            message: "Invalid date of birth - should not be in the future",
        },
    },
    gender: {
        type: String,
        required: true,
        maxLength: 20,
        enum: Object.values(genders_1.Genders),
    },
    maritalStatus: {
        type: String,
        maxLength: 20,
        enum: Object.values(maritalStatuses_1.MaritalStatuses),
    },
    roles: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Role" }],
    // RBAC fields for new permission system
    role: {
        type: String,
        enum: [
            'super-admin',
            'business-admin',
            'hr-admin',
            'department-head',
            'control-room',
            'staff'
        ],
        default: 'staff'
    },
    business: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: function () {
            // Business is required for all roles except super-admin and control-room
            return this.role && this.role !== 'super-admin' && this.role !== 'control-room';
        }
    },
    department: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Department",
        required: function () {
            // Department is required only for department-head role
            return this.role === 'department-head';
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    },
    // Two-Factor Authentication fields
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorSecret: {
        type: String,
        select: false, // Don't return by default for security
    },
}, { timestamps: true });
// FaceDescriptor management is handled explicitly in UserController
// (FaceDescriptor uses staffId, not user — descriptors are managed per-photo there)
exports.userFilterFields = {
    filterFields: [
        "name",
        "mobileNo",
        "email",
        "gender",
        "maritalStatus",
        "isActive",
        "isSuperAdmin",
        "role",
    ],
    searchFields: ["name", "mobileNo", "email"],
    sortFields: ["createdAt", "updatedAt"],
};
exports.User = mongoose_1.default.model("User", userSchema);
