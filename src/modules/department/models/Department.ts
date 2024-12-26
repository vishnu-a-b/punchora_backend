import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, maxLength: 200, required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
    head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const departmentFilterFields: ModelFilterInterface = {
  filterFields: ["business", "head"],
  searchFields: ["name"],
  sortFields: ["createdAt", "updatedAt"],
};

export const Department = mongoose.model("Department", departmentSchema);
