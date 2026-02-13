import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";
import { AttendanceStatus } from "../../base/enums/attendanceStatus";

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  // NEW FIELDS for enhanced GPS tracking
  accuracy: { type: Number, required: false },        // GPS accuracy in meters
  altitude: { type: Number, required: false },        // Elevation (if available)
  heading: { type: Number, required: false },         // Direction of movement (0-360)
  speed: { type: Number, required: false },           // Speed in m/s
  timestamp: { type: Number, required: false },       // Location capture timestamp
  mocked: { type: Boolean, required: false },         // Flag for fake/spoofed GPS
});

const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    checkInPhoto: { type: String, required: false, maxLength: 200 },
    checkOutPhoto: { type: String, required: false, maxLength: 200 },
    checkInLocation: { type: locationSchema },
    checkOutLocation: { type: locationSchema },
    status: {
      type: String,
      maxLength: 20,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.checkedIn,
    },
    // NEW FIELDS for idempotency and flagging
    idempotencyKey: {
      type: String,
      required: false,
      unique: true,           // Ensures no duplicate submissions
      sparse: true            // Allows null values
      // Index defined separately below (line 124)
    },

    // ENHANCED FLAGGING SYSTEM (Phase 3 - Control Room)
    flagged: {
      type: Boolean,
      default: false,
      index: true,
      description: "Whether this attendance record has been flagged for review"
    },
    flaggedAt: {
      type: Date,
      required: false,
      description: "When the record was flagged"
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      description: "User who flagged this record (Control Room, Admin)"
    },
    flaggedByName: {
      type: String,
      required: false,
      description: "Name of user who flagged (for quick display)"
    },
    flagReason: {
      type: String,
      enum: [
        "suspicious_location",
        "duplicate_entry",
        "time_mismatch",
        "missing_checkout",
        "gps_spoofing",
        "unusual_pattern",
        "other"
      ],
      required: false,
      description: "Reason for flagging"
    },
    flagNotes: {
      type: String,
      required: false,
      maxLength: 1000,
      description: "Additional notes about why flagged"
    },
    flagStatus: {
      type: String,
      enum: ["pending", "reviewed", "cleared", "confirmed"],
      default: "pending",
      required: false,
      description: "Status of flag review"
    },

    // FLAG REVIEW FIELDS
    reviewedAt: {
      type: Date,
      required: false,
      description: "When the flag was reviewed"
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      description: "User who reviewed the flag (Business Admin)"
    },
    reviewNotes: {
      type: String,
      required: false,
      maxLength: 1000,
      description: "Notes from flag review"
    },
  },
  { timestamps: true }
);

// Add indexes for faster duplicate detection and querying
attendanceSchema.index({ staff: 1, date: 1 });
// idempotencyKey index is created automatically by unique: true with sparse: true

// PHASE 5: Enhanced indexes for optimized queries
// Compound index for flagged record filtering (replaces separate flagged/flagStatus indexes)
attendanceSchema.index({ flagged: 1, flagStatus: 1, flaggedAt: -1 });
attendanceSchema.index({ flaggedBy: 1 }); // For tracking who flagged

// Date range queries (attendance anomalies, reports)
attendanceSchema.index({ date: 1, checkInTime: 1 }); // Late check-in queries

// GPS spoofing detection queries
attendanceSchema.index({ "checkInLocation.mocked": 1 });
attendanceSchema.index({ "checkOutLocation.mocked": 1 });

export const attendanceFilterFields: ModelFilterInterface = {
  filterFields: ["staff", "status"],
  searchFields: [],
  sortFields: ["createdAt", "updatedAt", "checkInTime"],
};

export const Attendance = mongoose.model("Attendance", attendanceSchema);
