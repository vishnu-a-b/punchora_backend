import mongoose from "mongoose";

/**
 * SyncBatch Model
 * Tracks batch synchronization operations from mobile offline attendance
 */

export enum SyncBatchStatus {
  PROCESSING = "processing",
  COMPLETED = "completed",
  PARTIAL = "partial",
  FAILED = "failed",
}

const syncBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "Unique identifier for this sync batch",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      description: "User who initiated the sync",
    },
    deviceId: {
      type: String,
      required: false,
      description: "Device identifier from mobile app",
    },
    totalRecords: {
      type: Number,
      required: true,
      min: 0,
      description: "Total number of records in batch",
    },
    processedRecords: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      description: "Number of successfully processed records",
    },
    failedRecords: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      description: "Number of failed records",
    },
    status: {
      type: String,
      enum: Object.values(SyncBatchStatus),
      default: SyncBatchStatus.PROCESSING,
      required: true,
      description: "Overall status of the batch",
    },
    errorSummary: {
      type: [
        {
          localId: String,
          error: String,
          timestamp: Date,
        },
      ],
      default: [],
      description: "Summary of errors encountered",
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
      description: "When sync batch processing started",
    },
    completedAt: {
      type: Date,
      required: false,
      description: "When sync batch processing completed",
    },
    durationMs: {
      type: Number,
      required: false,
      description: "Processing duration in milliseconds",
    },
  },
  { timestamps: true }
);

// Indexes for querying
syncBatchSchema.index({ userId: 1, createdAt: -1 });
syncBatchSchema.index({ status: 1, createdAt: -1 });
syncBatchSchema.index({ deviceId: 1 });

// Virtual for success rate
syncBatchSchema.virtual("successRate").get(function () {
  if (this.totalRecords === 0) return 0;
  return (this.processedRecords / this.totalRecords) * 100;
});

// Ensure virtuals are included in JSON/Object output
syncBatchSchema.set("toJSON", { virtuals: true });
syncBatchSchema.set("toObject", { virtuals: true });

export const SyncBatch = mongoose.model("SyncBatch", syncBatchSchema);
