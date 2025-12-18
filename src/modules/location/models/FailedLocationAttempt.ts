import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const failedLocationAttemptSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
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
  },
  { timestamps: true }
);

export const failedLocationAttemptFilterFields: ModelFilterInterface = {
  filterFields: ["staff", "reason"],
  searchFields: [],
  sortFields: ["createdAt", "updatedAt", "attemptTime"],
};

export const FailedLocationAttempt = mongoose.model(
  "FailedLocationAttempt",
  failedLocationAttemptSchema
);
