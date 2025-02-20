import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";
import { StaffRoles } from "../../base/enums/staffRoles";
import { User } from "../../user/models/User";
import { StaffTypes } from "../../base/enums/staffTypes";

const staffSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, maxLength: 200, required: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    designation: { type: String, maxLength: 200 },
    joinDate: {
      type: Date,
      required: true,
    },
    role: {
      type: String,
      required: true,
      maxLength: 20,
      enum: Object.values(StaffRoles),
    },
    type: {
      type: String,
      required: true,
      maxLength: 20,
      default: StaffTypes.inside,
      enum: Object.values(StaffTypes),
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

staffSchema.pre("validate", async function (next) {
  try {
    if (!this.name) {
      const patient = await User.findById(this.user.toString());
      if (patient) this.name = patient?.name;
    }
    next();
  } catch (e: any) {
    next(e);
  }
});

export const staffFilterFields: ModelFilterInterface = {
  filterFields: ["user", "department", "business", "designation"],
  searchFields: ["registrationNo", "name"],
  sortFields: ["createdAt", "updatedAt", "registrationDate"],
};

export const Staff = mongoose.model("Staff", staffSchema);
