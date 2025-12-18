import mongoose, { Schema, Document } from "mongoose";

export enum ActivityType {
  TEA_BREAK = "tea-break",
  LUNCH_BREAK = "lunch-break",
  WASHROOM = "washroom",
  CARE_OR_ONSITE = "care-or-onsite",
  TRIP = "trip",
  OTHER = "other"
}

export enum ActivityStatus {
  STARTED = "started",
  ENDED = "ended"
}

export interface IActivity extends Document {
  staff: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  type: ActivityType;
  status: ActivityStatus;

  // Time tracking
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes

  // Additional details based on activity type
  location?: string; // For care-or-onsite and trip
  reason?: string; // For all types
  photo?: string; // For care-or-onsite and trip

  // Trip specific fields
  meterReadingStart?: number; // For trip (driver)
  meterReadingEnd?: number; // For trip (driver)
  vehiclePhoto?: string; // For trip

  // Location data
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    },
    type: {
      type: String,
      enum: Object.values(ActivityType),
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ActivityStatus),
      required: true,
      default: ActivityStatus.STARTED
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number // in minutes
    },
    location: {
      type: String
    },
    reason: {
      type: String
    },
    photo: {
      type: String
    },
    meterReadingStart: {
      type: Number
    },
    meterReadingEnd: {
      type: Number
    },
    vehiclePhoto: {
      type: String
    },
    gpsLocation: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      },
      accuracy: {
        type: Number
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
ActivitySchema.index({ staff: 1, createdAt: -1 });
ActivitySchema.index({ business: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, status: 1 });
ActivitySchema.index({ startTime: 1 });

// Calculate duration before saving
ActivitySchema.pre("save", function (next) {
  if (this.endTime && this.startTime) {
    const endTime = this.endTime as Date;
    const startTime = this.startTime as Date;
    const durationMs = endTime.getTime() - startTime.getTime();
    this.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }
  next();
});

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
