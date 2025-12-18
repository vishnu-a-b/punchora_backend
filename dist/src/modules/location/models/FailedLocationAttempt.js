"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailedLocationAttempt = exports.failedLocationAttemptFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const failedLocationAttemptSchema = new mongoose_1.default.Schema({
    staff: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Staff", required: true },
    attemptTime: { type: Date, required: true },
    reason: {
        type: String,
        enum: ["location_off", "permission_denied", "timeout", "unknown_error"],
        required: true
    },
    errorMessage: { type: String },
    // Store the last known location if available
    lastKnownLatitude: { type: Number },
    lastKnownLongitude: { type: Number },
    lastKnownTime: { type: Date },
}, { timestamps: true });
exports.failedLocationAttemptFilterFields = {
    filterFields: ["staff", "reason"],
    searchFields: [],
    sortFields: ["createdAt", "updatedAt", "attemptTime"],
};
exports.FailedLocationAttempt = mongoose_1.default.model("FailedLocationAttempt", failedLocationAttemptSchema);
