import mongoose from "mongoose";
import ModelFilterInterface from "../../../../interfaces/ModelFilterInterface";

const talukSchema = new mongoose.Schema({
  name: { type: String, maxLength: 50, required: true },
  district: { type: mongoose.Schema.Types.ObjectId, ref: "District" },
});

export const talukFilterFields: ModelFilterInterface = {
  filterFields: ["name", "district"],
  searchFields: ["name"],
  sortFields: ["name"],
};

export const Taluk = mongoose.model("Taluk", talukSchema);
