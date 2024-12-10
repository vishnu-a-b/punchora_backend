import mongoose from "mongoose";
import { ManagementTypes } from "../../base/enums/managementTypes";
import { HospitalTypes } from "../../base/enums/hospitalTypes";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";
import { TreatmentTypes } from "../../base/enums/treatmentTypes";

const hospitalSchema = new mongoose.Schema(
  {
    huid: { type: String, maxLength: 50, unique: true, required: true },
    name: { type: String, maxLength: 200, required: true },
    address: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
    photos: [{ type: String, maxLength: 200 }],
    specialities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Speciality" }],
    managementType: {
      type: String,
      required: true,
      maxLength: 20,
      enum: Object.values(ManagementTypes),
      default: ManagementTypes.unknown,
    },
    hospitalType: {
      type: String,
      required: true,
      maxLength: 20,
      enum: Object.values(HospitalTypes),
      default: HospitalTypes.unknown,
    },
    treatmentType: {
      type: String,
      required: true,
      maxLength: 20,
      enum: Object.values(TreatmentTypes),
      default: TreatmentTypes.unknown,
    },
    numberOfBeds: { type: Number, maxLength: 10, required: false },
    haveEmergency: {
      type: Boolean,
      required: true,
      default: false,
    },
    contactMobileNumbers: [{ type: String, maxLength: 20, required: false }],
    contactLandlines: [{ type: String, maxLength: 20, required: false }],
    isIndependent: {
      type: Boolean,
      required: true,
      default: false,
    },
    vcLink: {
      type: String,
    },
  },
  { timestamps: true }
);

hospitalSchema.pre("validate", async function (next) {
  this.huid = this.name + Date.now();
  next();
});
export const hospitalFilterFields: ModelFilterInterface = {
  filterFields: [
    "managementType",
    "hospitalType",
    "treatmentType",
    "numberOfBeds",
    "haveEmergency",
    "specialities",
  ],
  searchFields: ["name"],
  sortFields: ["createdAt", "updatedAt"],
};

export const Hospital = mongoose.model("Hospital", hospitalSchema);
