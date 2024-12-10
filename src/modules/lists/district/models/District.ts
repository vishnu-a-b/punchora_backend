import mongoose from "mongoose";
import ModelFilterInterface from "../../../../interfaces/ModelFilterInterface";

const districtSchema = new mongoose.Schema(
  {
    name: { type: String, maxLength: 50, required: true },
  },
  { timestamps: true }
);
export const districtFilterFields: ModelFilterInterface = {
  filterFields: ["name"],
  searchFields: ["name"],
  sortFields: ["name"],
};
export const District = mongoose.model("District", districtSchema);
