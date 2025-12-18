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
      sparse: true,           // Allows null values
      index: true             // Fast lookup
    },
    flagged: {
      type: Boolean,
      default: false,
      index: true
    },
    flagReason: { type: String, required: false },
  },
  { timestamps: true }
);

// Add indexes for faster duplicate detection and querying
attendanceSchema.index({ staff: 1, date: 1 });
attendanceSchema.index({ idempotencyKey: 1 }, { sparse: true });
attendanceSchema.index({ flagged: 1 });

export const attendanceFilterFields: ModelFilterInterface = {
  filterFields: ["staff", "status"],
  searchFields: [],
  sortFields: ["createdAt", "updatedAt", "checkInTime"],
};

export const Attendance = mongoose.model("Attendance", attendanceSchema);
