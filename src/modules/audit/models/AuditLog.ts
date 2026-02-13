import mongoose, { Schema, Document } from "mongoose";

/**
 * Audit Action Types
 * Tracks all significant actions in the system
 */
export enum AuditAction {
  // Authentication
  LOGIN = "login",
  LOGOUT = "logout",
  LOGIN_FAILED = "login_failed",
  PASSWORD_CHANGE = "password_change",

  // User Management
  USER_CREATE = "user_create",
  USER_UPDATE = "user_update",
  USER_DELETE = "user_delete",
  USER_PHOTO_UPDATE = "user_photo_update",
  USER_PHOTO_DELETE = "user_photo_delete",

  // Role Management
  ROLE_ASSIGN = "role_assign",
  ROLE_REVOKE = "role_revoke",
  ROLE_CHANGE = "role_change",

  // Staff Management
  STAFF_CREATE = "staff_create",
  STAFF_UPDATE = "staff_update",
  STAFF_DELETE = "staff_delete",

  // Attendance
  ATTENDANCE_CREATE = "attendance_create",
  ATTENDANCE_UPDATE = "attendance_update",
  ATTENDANCE_DELETE = "attendance_delete",
  ATTENDANCE_MARK = "attendance_mark",
  ATTENDANCE_FLAG = "attendance_flag",
  ATTENDANCE_REVIEW = "attendance_review",
  ATTENDANCE_FLAG_CLEAR = "attendance_flag_clear",

  // Alerts
  ALERT_CREATE = "alert_create",
  ALERT_ACKNOWLEDGE = "alert_acknowledge",
  ALERT_RESOLVE = "alert_resolve",
  ALERT_DISMISS = "alert_dismiss",

  // Leave Requests
  LEAVE_REQUEST_CREATE = "leave_request_create",
  LEAVE_REQUEST_UPDATE = "leave_request_update",
  LEAVE_REQUEST_DELETE = "leave_request_delete",
  LEAVE_APPROVE = "leave_approve",
  LEAVE_REJECT = "leave_reject",
  LEAVE_CANCEL = "leave_cancel",

  // Business
  BUSINESS_CREATE = "business_create",
  BUSINESS_UPDATE = "business_update",
  BUSINESS_DELETE = "business_delete",

  // Department
  DEPARTMENT_CREATE = "department_create",
  DEPARTMENT_UPDATE = "department_update",
  DEPARTMENT_DELETE = "department_delete",

  // Reports
  REPORT_GENERATE = "report_generate",
  REPORT_EXPORT = "report_export",

  // Jobs
  JOB_EXECUTE = "job_execute",

  // Settings
  SETTINGS_UPDATE = "settings_update",

  // Face Recognition
  FACE_DESCRIPTOR_CREATE = "face_descriptor_create",
  FACE_DESCRIPTOR_DELETE = "face_descriptor_delete",

  // Activity
  ACTIVITY_START = "activity_start",
  ACTIVITY_END = "activity_end",

  // Security Events (Phase 6)
  API_KEY_CREATED = "api_key_created",
  API_KEY_REVOKED = "api_key_revoked",
  API_KEY_UPDATED = "api_key_updated",
  API_KEY_USED = "api_key_used",
  TWO_FACTOR_ENABLED = "two_factor_enabled",
  TWO_FACTOR_DISABLED = "two_factor_disabled",
  TWO_FACTOR_FAILED = "two_factor_failed",
  BACKUP_CODES_GENERATED = "backup_codes_generated",
  IP_BLOCKED = "ip_blocked",
  CSRF_TOKEN_INVALID = "csrf_token_invalid",

  // Performance Events (Phase 6)
  SLOW_QUERY = "slow_query",
  CACHE_MISS = "cache_miss",
  HIGH_MEMORY_USAGE = "high_memory_usage",

  // Data Access (Phase 6)
  DATA_EXPORT = "data_export",
  DATA_IMPORT = "data_import",
  BULK_OPERATION = "bulk_operation",
}

export interface IAuditLog extends Document {
  // Action Information
  action: AuditAction;
  resource: string; // Resource type: user, staff, attendance, etc.
  resourceId?: mongoose.Types.ObjectId | string; // ID of affected resource

  // User Information
  userId?: mongoose.Types.ObjectId; // Who performed the action
  userName?: string; // Name for quick display
  userRole?: string; // Role at time of action
  userEmail?: string; // Email for tracking

  // Business Context
  business?: mongoose.Types.ObjectId; // Which business (if applicable)
  department?: mongoose.Types.ObjectId; // Which department (if applicable)

  // Action Details
  changes?: {
    before?: any; // State before change
    after?: any; // State after change
  };
  metadata?: any; // Additional context

  // Request Information
  ipAddress?: string; // IP address of request
  userAgent?: string; // Browser/client info
  endpoint?: string; // API endpoint called
  method?: string; // HTTP method (GET, POST, etc.)

  // Result
  status: "success" | "failure"; // Did it work?
  errorMessage?: string; // Error if failed

  // Timestamps
  timestamp: Date; // When it happened
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
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
      type: Schema.Types.Mixed, // Can be ObjectId or string
      required: false,
      index: true,
    },

    // User Information
    userId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: false,
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },

    // Action Details
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    metadata: {
      type: Schema.Types.Mixed,
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
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

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

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
