"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationAlert = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const locationAlertSchema = new mongoose_1.default.Schema({
    staff: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Staff", required: true },
    alertType: {
        type: String,
        enum: ["location_disabled", "mocked_gps", "no_update", "permission_denied"],
        required: true
    },
    severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium"
    },
    message: { type: String, required: true },
    details: { type: mongoose_1.default.Schema.Types.Mixed }, // Additional context
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
}, { timestamps: true });
// Index for faster queries
locationAlertSchema.index({ staff: 1, createdAt: -1 });
locationAlertSchema.index({ acknowledged: 1, createdAt: -1 });
exports.LocationAlert = mongoose_1.default.model("LocationAlert", locationAlertSchema);
