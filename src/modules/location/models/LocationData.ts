import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const locationSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const locationDataFilterFields: ModelFilterInterface = {
  filterFields: ["staff"],
  searchFields: [],
  sortFields: ["createdAt", "updatedAt", "date"],
};

export const LocationData = mongoose.model("LocationData", locationSchema);
