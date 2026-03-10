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
    mocked: { type: Boolean, default: false },
    accuracy: { type: Number },
    altitude: { type: Number },
    speed: { type: Number },             // Fix 4: speed in m/s
    heading: { type: Number },           // Fix 4: direction 0-360°
    sessionId: { type: String, index: true }, // Fix 7: links points to an attendance record
  },
  { timestamps: true }
);

export const locationDataFilterFields: ModelFilterInterface = {
  filterFields: ["staff"],
  searchFields: [],
  sortFields: ["createdAt", "updatedAt", "date"],
};

export const LocationData = mongoose.model("LocationData", locationSchema);
