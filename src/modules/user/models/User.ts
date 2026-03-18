import mongoose from "mongoose";
import { Genders } from "../../base/enums/genders";
import { MaritalStatuses } from "../../base/enums/maritalStatuses";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";
import { FaceDescriptor } from "../../faceDescriptor/models/FaceDescriptor";

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
    // RBAC fields for new permission system
    role: {
      type: String,
      enum: [
        'super-admin',
        'business-admin',
        'hr-admin',
        'department-head',
        'control-room',
        'staff'
      ],
      default: 'staff'
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: function(this: any) {
        // Business is required for all roles except super-admin and control-room
        return this.role && this.role !== 'super-admin' && this.role !== 'control-room';
      }
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: function(this: any) {
        // Department is required only for department-head role
        return this.role === 'department-head';
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    // Two-Factor Authentication fields
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Don't return by default for security
    },
  },
  { timestamps: true }
);

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const filter = this.getFilter();
  if (!update) return next();
  if ("photos" in update) {
    console.log(
      "there is photos field in update body. deleting all descriptors available"
    );
    await FaceDescriptor.deleteMany({ user: filter._id });
  }
  next();
});

export const userFilterFields: ModelFilterInterface = {
  filterFields: [
    "name",
    "mobileNo",
    "email",
    "gender",
    "maritalStatus",
    "isActive",
    "isSuperAdmin",
    "role",
  ],
  searchFields: ["name", "mobileNo", "email"],
  sortFields: ["createdAt", "updatedAt"],
};

export const User = mongoose.model("User", userSchema);
