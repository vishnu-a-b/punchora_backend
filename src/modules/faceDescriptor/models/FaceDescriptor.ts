import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const faceDescriptorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    descriptor: [{ type: Number }],
  },
  { timestamps: true }
);
export const faceDescriptorFilterFields: ModelFilterInterface = {
  filterFields: ["user", "staff"],
  searchFields: [],
  sortFields: [],
};

export const FaceDescriptor = mongoose.model(
  "FaceDescriptor",
  faceDescriptorSchema
);
