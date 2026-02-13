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
exports.AuditLog = exports.AuditAction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Audit Action Types
 * Tracks all significant actions in the system
 */
var AuditAction;
(function (AuditAction) {
    // Authentication
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
    AuditAction["LOGIN_FAILED"] = "login_failed";
    AuditAction["PASSWORD_CHANGE"] = "password_change";
    // User Management
    AuditAction["USER_CREATE"] = "user_create";
    AuditAction["USER_UPDATE"] = "user_update";
    AuditAction["USER_DELETE"] = "user_delete";
    AuditAction["USER_PHOTO_UPDATE"] = "user_photo_update";
    AuditAction["USER_PHOTO_DELETE"] = "user_photo_delete";
    // Role Management
    AuditAction["ROLE_ASSIGN"] = "role_assign";
    AuditAction["ROLE_REVOKE"] = "role_revoke";
    AuditAction["ROLE_CHANGE"] = "role_change";
    // Staff Management
    AuditAction["STAFF_CREATE"] = "staff_create";
    AuditAction["STAFF_UPDATE"] = "staff_update";
    AuditAction["STAFF_DELETE"] = "staff_delete";
    // Attendance
    AuditAction["ATTENDANCE_CREATE"] = "attendance_create";
    AuditAction["ATTENDANCE_UPDATE"] = "attendance_update";
    AuditAction["ATTENDANCE_DELETE"] = "attendance_delete";
    AuditAction["ATTENDANCE_MARK"] = "attendance_mark";
    AuditAction["ATTENDANCE_FLAG"] = "attendance_flag";
    AuditAction["ATTENDANCE_REVIEW"] = "attendance_review";
    AuditAction["ATTENDANCE_FLAG_CLEAR"] = "attendance_flag_clear";
    // Alerts
    AuditAction["ALERT_CREATE"] = "alert_create";
    AuditAction["ALERT_ACKNOWLEDGE"] = "alert_acknowledge";
    AuditAction["ALERT_RESOLVE"] = "alert_resolve";
    AuditAction["ALERT_DISMISS"] = "alert_dismiss";
    // Leave Requests
    AuditAction["LEAVE_REQUEST_CREATE"] = "leave_request_create";
    AuditAction["LEAVE_REQUEST_UPDATE"] = "leave_request_update";
    AuditAction["LEAVE_REQUEST_DELETE"] = "leave_request_delete";
    AuditAction["LEAVE_APPROVE"] = "leave_approve";
    AuditAction["LEAVE_REJECT"] = "leave_reject";
    AuditAction["LEAVE_CANCEL"] = "leave_cancel";
    // Business
    AuditAction["BUSINESS_CREATE"] = "business_create";
    AuditAction["BUSINESS_UPDATE"] = "business_update";
    AuditAction["BUSINESS_DELETE"] = "business_delete";
    // Department
    AuditAction["DEPARTMENT_CREATE"] = "department_create";
    AuditAction["DEPARTMENT_UPDATE"] = "department_update";
    AuditAction["DEPARTMENT_DELETE"] = "department_delete";
    // Reports
    AuditAction["REPORT_GENERATE"] = "report_generate";
    AuditAction["REPORT_EXPORT"] = "report_export";
    // Jobs
    AuditAction["JOB_EXECUTE"] = "job_execute";
    // Settings
    AuditAction["SETTINGS_UPDATE"] = "settings_update";
    // Face Recognition
    AuditAction["FACE_DESCRIPTOR_CREATE"] = "face_descriptor_create";
    AuditAction["FACE_DESCRIPTOR_DELETE"] = "face_descriptor_delete";
    // Activity
    AuditAction["ACTIVITY_START"] = "activity_start";
    AuditAction["ACTIVITY_END"] = "activity_end";
    // Security Events (Phase 6)
    AuditAction["API_KEY_CREATED"] = "api_key_created";
    AuditAction["API_KEY_REVOKED"] = "api_key_revoked";
    AuditAction["API_KEY_UPDATED"] = "api_key_updated";
    AuditAction["API_KEY_USED"] = "api_key_used";
    AuditAction["TWO_FACTOR_ENABLED"] = "two_factor_enabled";
    AuditAction["TWO_FACTOR_DISABLED"] = "two_factor_disabled";
    AuditAction["TWO_FACTOR_FAILED"] = "two_factor_failed";
    AuditAction["BACKUP_CODES_GENERATED"] = "backup_codes_generated";
    AuditAction["IP_BLOCKED"] = "ip_blocked";
    AuditAction["CSRF_TOKEN_INVALID"] = "csrf_token_invalid";
    // Performance Events (Phase 6)
    AuditAction["SLOW_QUERY"] = "slow_query";
    AuditAction["CACHE_MISS"] = "cache_miss";
    AuditAction["HIGH_MEMORY_USAGE"] = "high_memory_usage";
    // Data Access (Phase 6)
    AuditAction["DATA_EXPORT"] = "data_export";
    AuditAction["DATA_IMPORT"] = "data_import";
    AuditAction["BULK_OPERATION"] = "bulk_operation";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
const AuditLogSchema = new mongoose_1.Schema({
    // Action Information
    action: {
        type: String,
        enum: Object.values(AuditAction),
        required: true,
        index: true,
    },
    resource: {
        type: String,
        required: true,
        index: true,
    },
    resourceId: {
        type: mongoose_1.Schema.Types.Mixed, // Can be ObjectId or string
        required: false,
        index: true,
    },
    // User Information
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true,
    },
    userName: {
        type: String,
        required: false,
    },
    userRole: {
        type: String,
        required: false,
    },
    userEmail: {
        type: String,
        required: false,
    },
    // Business Context
    business: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Business",
        required: false,
        index: true,
    },
    department: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Department",
        required: false,
    },
    // Action Details
    changes: {
        before: { type: mongoose_1.Schema.Types.Mixed },
        after: { type: mongoose_1.Schema.Types.Mixed },
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    // Request Information
    ipAddress: {
        type: String,
        required: false,
    },
    userAgent: {
        type: String,
        required: false,
    },
    endpoint: {
        type: String,
        required: false,
    },
    method: {
        type: String,
        required: false,
    },
    // Result
    status: {
        type: String,
        enum: ["success", "failure"],
        required: true,
        default: "success",
        index: true,
    },
    errorMessage: {
        type: String,
        required: false,
    },
    // Timestamp
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});
// Compound Indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 }); // User activity timeline
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 }); // Resource history
AuditLogSchema.index({ business: 1, timestamp: -1 }); // Business activity
AuditLogSchema.index({ action: 1, timestamp: -1 }); // Action type queries
AuditLogSchema.index({ timestamp: -1 }); // Recent activity
// TTL Index - Auto-delete logs after 90 days (configurable)
// Note: Set expireAfterSeconds to 0 and use timestamp field with TTL
// To enable: db.auditlogs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 7776000 })
// 7776000 seconds = 90 days
// Prevent modifications to audit logs (immutable)
AuditLogSchema.pre("updateOne", function (next) {
    next(new Error("Audit logs are immutable and cannot be modified"));
});
AuditLogSchema.pre("findOneAndUpdate", function (next) {
    next(new Error("Audit logs are immutable and cannot be modified"));
});
AuditLogSchema.pre("updateMany", function (next) {
    next(new Error("Audit logs are immutable and cannot be modified"));
});
exports.AuditLog = mongoose_1.default.model("AuditLog", AuditLogSchema);
