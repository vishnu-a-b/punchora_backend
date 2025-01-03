import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const addressSchema = new mongoose.Schema(
  {
    address: { type: String, maxLength: 200, required: true },
    taluk: { type: String, maxLength: 50, unique: false },
    district: { type: String, maxLength: 50, unique: false },
    pinCode: { type: String, maxLength: 10, unique: false, required: true },
    latitude: { type: Number, maxLength: 20, unique: false, required: false },
    longitude: { type: Number, maxLength: 20, unique: false, required: false },
  },
  { timestamps: true }
);

export const addressFilterFields: ModelFilterInterface = {
  filterFields: ["taluk", "district", "pinCode", "latitude", "longitude"],
  searchFields: ["address", "taluk", "district", "pinCode"],
  sortFields: ["createdAt", "updatedAt"],
};
export const Address = mongoose.model("Address", addressSchema);
