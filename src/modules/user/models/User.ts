import mongoose from "mongoose";
import { Genders } from "../../base/enums/genders";
import { MaritalStatuses } from "../../base/enums/maritalStatuses";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: false, maxLength: 100 },
    mobileNo: { type: String, required: true, unique: true, maxLength: 20 },
    password: { type: String, required: true, maxLength: 150, select: false },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    photos: [{ type: String, maxLength: 200 }],
    profilePicture: { type: String },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          return value <= new Date();
        },
        message: "Invalid date of birth - should not be in the future",
      },
    },
    gender: {
      type: String,
      required: true,
      maxLength: 20,
      enum: Object.values(Genders),
    },
    maritalStatus: {
      type: String,
      maxLength: 20,
      enum: Object.values(MaritalStatuses),
    },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const userFilterFields: ModelFilterInterface = {
  filterFields: [
    "name",
    "mobileNo",
    "email",
    "gender",
    "maritalStatus",
    "isActive",
    "isSuperAdmin",
  ],
  searchFields: ["name", "mobileNo", "email"],
  sortFields: ["createdAt", "updatedAt"],
};

export const User = mongoose.model("User", userSchema);
