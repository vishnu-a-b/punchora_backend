import mongoose from "mongoose";
import { ManagementTypes } from "../../base/enums/managementTypes";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, maxLength: 200, required: true },
    address: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
    photos: [{ type: String, maxLength: 200 }],
    managementType: {
      type: String,
      maxLength: 20,
      enum: Object.values(ManagementTypes),
    },
    contactMobileNumbers: [{ type: String, maxLength: 20, required: false }],
    contactLandlines: [{ type: String, maxLength: 20, required: false }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vcLink: {
      type: String,
    },
  },
  { timestamps: true }
);

export const businessFilterFields: ModelFilterInterface = {
  filterFields: ["admin", "managementType"],
  searchFields: ["name"],
  sortFields: ["createdAt", "updatedAt"],
};

export const Business = mongoose.model("Business", businessSchema);
