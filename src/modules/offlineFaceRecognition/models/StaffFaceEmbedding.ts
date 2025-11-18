import mongoose, { Schema, Document } from "mongoose";

/**
 * StaffFaceEmbedding Model
 * Stores face embeddings generated using ONNX MobileFaceNet for offline recognition
 * Separate from the existing faceDescriptor collection (which uses face-api.js)
 */

export interface IStaffFaceEmbedding extends Document {
  staffId: mongoose.Types.ObjectId;
  modelName: string; // e.g., "MobileFaceNet"
  embedding: number[]; // 128-dimensional embedding
  embeddingVersion: string; // e.g., "v1.0"
  photoUrl: string; // Local path or S3 URL
  createdAt: Date;
  updatedAt: Date;
}

const StaffFaceEmbeddingSchema: Schema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    modelName: {
      type: String,
      required: true,
      default: "MobileFaceNet",
    },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v: number[]) {
          // Support both MobileFaceNet (128-dim) and ArcFace (512-dim)
          return v.length === 128 || v.length === 512;
        },
        message: "Embedding must be either 128-dimensional (MobileFaceNet) or 512-dimensional (ArcFace)",
      },
    },
    embeddingVersion: {
      type: String,
      required: true,
      default: "v1.0",
    },
    photoUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
StaffFaceEmbeddingSchema.index({ staffId: 1, updatedAt: -1 });
StaffFaceEmbeddingSchema.index({ updatedAt: -1 }); // For sync queries

const StaffFaceEmbedding = mongoose.model<IStaffFaceEmbedding>(
  "StaffFaceEmbedding",
  StaffFaceEmbeddingSchema
);

export { StaffFaceEmbedding };
export default StaffFaceEmbedding;
