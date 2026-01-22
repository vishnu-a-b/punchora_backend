import mongoose from "mongoose";

const locationAlertSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
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
    details: { type: mongoose.Schema.Types.Mixed }, // Additional context
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for faster queries
locationAlertSchema.index({ staff: 1, createdAt: -1 });
locationAlertSchema.index({ acknowledged: 1, createdAt: -1 });

export const LocationAlert = mongoose.model("LocationAlert", locationAlertSchema);
