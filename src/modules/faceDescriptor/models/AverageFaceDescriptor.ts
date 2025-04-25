import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const averageFaceDescriptorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    descriptor: [{ type: Number }],
  },
  { timestamps: true }
);
export const averageFaceDescriptorFilterFields: ModelFilterInterface = {
  filterFields: ["user"],
  searchFields: [],
  sortFields: [],
};

export const AverageFaceDescriptor = mongoose.model(
  "AverageFaceDescriptor",
  averageFaceDescriptorSchema
);
