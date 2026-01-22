import mongoose, { Schema, Document } from "mongoose";

export enum AlertType {
  LOCATION_DISABLED = "location_disabled",
  LATE_CHECKIN = "late_checkin",
  MOCKED_GPS = "mocked_gps",
  MISSING_CHECKOUT = "missing_checkout",
  GEO_VIOLATION = "geo_violation",
  ATTENDANCE_ANOMALY = "attendance_anomaly",
}

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum AlertStatus {
  ACTIVE = "active",
  ACKNOWLEDGED = "acknowledged",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

export interface IAlertMetadata {
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: Date;
  expectedLocation?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  [key: string]: any;
}

export interface IAlert extends Document {
  type: AlertType;
  severity: AlertSeverity;

  // Staff and business context
  staff: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;

  // Alert details
  title: string;
  message: string;
  metadata: IAlertMetadata;

  // Tracking
  status: AlertStatus;
  priority: number; // 1-5, higher = more urgent

  // Acknowledgment
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedByName?: string;

  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionNotes?: string;

  // Auto-expiry
  expiresAt?: Date; // Auto-dismiss after X hours

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const AlertMetadataSchema: Schema = new Schema(
  {
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
  },
  { strict: false, _id: false }
);

const AlertSchema: Schema = new Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
AlertSchema.index({ business: 1, status: 1, createdAt: -1 });
AlertSchema.index({ staff: 1, status: 1, createdAt: -1 });
AlertSchema.index({ type: 1, severity: 1, status: 1 });
AlertSchema.index({ status: 1, priority: -1, createdAt: -1 });
AlertSchema.index({ acknowledged: 1, status: 1 });

// Index for expiry cleanup
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for staff name (populated)
AlertSchema.virtual("staffName").get(function (this: IAlert) {
  return (this.staff as any)?.name || "Unknown";
});

// Virtual for business name (populated)
AlertSchema.virtual("businessName").get(function (this: IAlert) {
  return (this.business as any)?.name || "Unknown";
});

// Ensure virtuals are included in JSON
AlertSchema.set("toJSON", { virtuals: true });
AlertSchema.set("toObject", { virtuals: true });

export const Alert = mongoose.model<IAlert>("Alert", AlertSchema);
