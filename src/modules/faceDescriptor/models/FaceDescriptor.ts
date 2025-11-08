import mongoose, { Schema, Document } from "mongoose";

export interface IFaceDescriptor extends Document {
  staffId: mongoose.Types.ObjectId;
  staffName: string;
  descriptor: number[]; // 128-dimensional face embedding
  photoUrl?: string;
  business: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FaceDescriptorSchema: Schema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    descriptor: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v: number[]) {
          return v.length === 128; // Standard face embedding size
        },
        message: "Face descriptor must be 128-dimensional",
      },
    },
    photoUrl: {
      type: String,
      required: false,
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
FaceDescriptorSchema.index({ business: 1, isActive: 1, updatedAt: -1 });
FaceDescriptorSchema.index({ staffId: 1, isActive: 1 });

const FaceDescriptor = mongoose.model<IFaceDescriptor>(
  "FaceDescriptor",
  FaceDescriptorSchema
);

export { FaceDescriptor };
export default FaceDescriptor;
