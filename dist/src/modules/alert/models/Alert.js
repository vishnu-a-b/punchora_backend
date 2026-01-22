"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = exports.AlertStatus = exports.AlertSeverity = exports.AlertType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var AlertType;
(function (AlertType) {
    AlertType["LOCATION_DISABLED"] = "location_disabled";
    AlertType["LATE_CHECKIN"] = "late_checkin";
    AlertType["MOCKED_GPS"] = "mocked_gps";
    AlertType["MISSING_CHECKOUT"] = "missing_checkout";
    AlertType["GEO_VIOLATION"] = "geo_violation";
    AlertType["ATTENDANCE_ANOMALY"] = "attendance_anomaly";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["DISMISSED"] = "dismissed";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
const AlertMetadataSchema = new mongoose_1.Schema({
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
    timestamp: { type: Date },
    expectedLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
    distance: { type: Number },
}, { strict: false, _id: false });
const AlertSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(AlertType),
        required: true,
        index: true,
    },
    severity: {
        type: String,
        enum: Object.values(AlertSeverity),
        required: true,
        index: true,
    },
    // Staff and business context
    staff: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Staff",
        required: true,
        index: true,
    },
    business: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true,
    },
    department: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Department",
        required: false,
    },
    // Alert details
    title: {
        type: String,
        required: true,
        maxLength: 200,
    },
    message: {
        type: String,
        required: true,
        maxLength: 1000,
    },
    metadata: {
        type: AlertMetadataSchema,
        default: {},
    },
    // Tracking
    status: {
        type: String,
        enum: Object.values(AlertStatus),
        default: AlertStatus.ACTIVE,
        required: true,
        index: true,
    },
    priority: {
        type: Number,
        required: true,
        default: 3,
        min: 1,
        max: 5,
    },
    // Acknowledgment
    acknowledged: {
        type: Boolean,
        default: false,
        index: true,
    },
    acknowledgedAt: {
        type: Date,
        required: false,
    },
    acknowledgedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    acknowledgedByName: {
        type: String,
        required: false,
    },
    // Resolution
    resolved: {
        type: Boolean,
        default: false,
        index: true,
    },
    resolvedAt: {
        type: Date,
        required: false,
    },
    resolvedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    resolutionNotes: {
        type: String,
        required: false,
        maxLength: 1000,
    },
    // Auto-expiry
    expiresAt: {
        type: Date,
        required: false,
        index: true,
    },
}, {
    timestamps: true,
});
// Compound indexes for efficient querying
AlertSchema.index({ business: 1, status: 1, createdAt: -1 });
AlertSchema.index({ staff: 1, status: 1, createdAt: -1 });
AlertSchema.index({ type: 1, severity: 1, status: 1 });
AlertSchema.index({ status: 1, priority: -1, createdAt: -1 });
AlertSchema.index({ acknowledged: 1, status: 1 });
// Index for expiry cleanup
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Virtual for staff name (populated)
AlertSchema.virtual("staffName").get(function () {
    var _a;
    return ((_a = this.staff) === null || _a === void 0 ? void 0 : _a.name) || "Unknown";
});
// Virtual for business name (populated)
AlertSchema.virtual("businessName").get(function () {
    var _a;
    return ((_a = this.business) === null || _a === void 0 ? void 0 : _a.name) || "Unknown";
});
// Ensure virtuals are included in JSON
AlertSchema.set("toJSON", { virtuals: true });
AlertSchema.set("toObject", { virtuals: true });
exports.Alert = mongoose_1.default.model("Alert", AlertSchema);
