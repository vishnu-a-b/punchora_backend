import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, maxLength: 200, required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const departmentFilterFields: ModelFilterInterface = {
  filterFields: ["hospital", "head"],
  searchFields: ["name"],
  sortFields: ["createdAt", "updatedAt"],
};

export const Department = mongoose.model("Department", departmentSchema);
