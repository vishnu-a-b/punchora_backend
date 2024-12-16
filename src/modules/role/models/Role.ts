import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const roleSchema = new mongoose.Schema({
  title: { type: String, maxLength: 50, required: true },
  slug: { type: String, maxLength: 50, unique: true, required: true },
});
export const roleFilterFields: ModelFilterInterface = {
  filterFields: ["slug"],
  searchFields: ["title", "slug"],
  sortFields: [],
};

export const Role = mongoose.model("Role", roleSchema);
