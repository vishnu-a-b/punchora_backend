import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";
import { StaffRoles } from "../../base/enums/staffRoles";
import { User } from "../../user/models/User";
import { StaffTypes } from "../../base/enums/staffTypes";

export const StaffShiftTypes = {
  HOUR_BASE: "hour base",
  SINGLE_SHIFT: "single shift",
  MULTI_SHIFT: "multi shift",
  NO_TIMING: "no timing",
} as const;
export type StaffShiftTypes = typeof StaffShiftTypes[keyof typeof StaffShiftTypes];

// Define interface for shift entry

const shiftEntrySchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  minutesWorked: { type: Number, required: true, min: 0 },
});


const staffSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, maxLength: 200, required: true },
    uid: { type: Number },
    // PHASE 4: Multi-Department Support
    // Primary department (required for backward compatibility)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      description: "Primary department - staff's main department",
    },
    // Additional departments (optional - Phase 4 enhancement)
    additionalDepartments: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Department",
      default: [],
      description: "Secondary departments staff can work in",
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
    isActive: {
      type: Boolean,
      default: true,
    },
    salary: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shiftType: {
      type: String,
      enum: Object.values(StaffShiftTypes),
      default: StaffShiftTypes.SINGLE_SHIFT,
    },
    hoursWorked: {
      type: Number,
      default: 0,
      min: 0,
      description: "Total minutes worked",
    },
    shifts: {
      type: [shiftEntrySchema],
      default: [],
    },
    expoPushToken: { type: String, default: null },
  },
  { timestamps: true }
);

// PHASE 4: Virtual field for all departments
staffSchema.virtual("allDepartments").get(function () {
  // Combine primary department with additional departments
  const primary = this.department;
  const additional = this.additionalDepartments || [];

  // Return array with primary first, then additional (no duplicates)
  const allDepts = [primary];
  additional.forEach((dept: any) => {
    if (dept && dept.toString() !== primary.toString()) {
      allDepts.push(dept);
    }
  });

  return allDepts;
});

// PHASE 4: Helper method to check if staff belongs to a department
staffSchema.methods.belongsToDepartment = function (departmentId: string): boolean {
  const deptIdStr = departmentId.toString();

  // Check primary department
  if (this.department && this.department.toString() === deptIdStr) {
    return true;
  }

  // Check additional departments
  if (this.additionalDepartments && this.additionalDepartments.length > 0) {
    return this.additionalDepartments.some(
      (dept: any) => dept && dept.toString() === deptIdStr
    );
  }

  return false;
};

// PHASE 4: Helper method to add staff to a department
staffSchema.methods.addToDepartment = async function (departmentId: string): Promise<void> {
  const deptIdStr = departmentId.toString();

  // Don't add if already primary
  if (this.department && this.department.toString() === deptIdStr) {
    return;
  }

  // Don't add if already in additional
  if (this.additionalDepartments && this.additionalDepartments.some(
    (dept: any) => dept && dept.toString() === deptIdStr
  )) {
    return;
  }

  // Add to additional departments
  if (!this.additionalDepartments) {
    this.additionalDepartments = [];
  }
  this.additionalDepartments.push(new mongoose.Types.ObjectId(deptIdStr));
  await this.save();
};

// PHASE 4: Helper method to remove staff from a department
staffSchema.methods.removeFromDepartment = async function (departmentId: string): Promise<void> {
  const deptIdStr = departmentId.toString();

  // Cannot remove primary department
  if (this.department && this.department.toString() === deptIdStr) {
    throw new Error("Cannot remove staff from primary department. Change primary department first.");
  }

  // Remove from additional departments
  if (this.additionalDepartments && this.additionalDepartments.length > 0) {
    this.additionalDepartments = this.additionalDepartments.filter(
      (dept: any) => dept && dept.toString() !== deptIdStr
    );
    await this.save();
  }
};

staffSchema.pre("validate", async function (next) {
  try {
    if (!this.name) {
      const patient = await User.findById(this.user.toString());
      if (patient) this.name = patient?.name;
    }
    const prevStaffs = await Staff.find().sort({ createdAt: -1 });
    if (prevStaffs && prevStaffs.length > 0) {
      this.uid = prevStaffs[0].uid ?? 100 + 1;
    } else {
      this.uid = 101;
    }
    next();
  } catch (e: any) {
    next(e);
  }
});

// PHASE 4: Add index for additional departments
staffSchema.index({ additionalDepartments: 1 });

// Ensure virtuals are included in JSON/Object output
staffSchema.set("toJSON", { virtuals: true });
staffSchema.set("toObject", { virtuals: true });

export const staffFilterFields: ModelFilterInterface = {
  filterFields: [
    "user",
    "department",
    "business",
    "designation",
    "uid",
    "isActive",
  ],
  searchFields: ["registrationNo", "name"],
  sortFields: ["createdAt", "updatedAt", "registrationDate"],
};

export const Staff = mongoose.model("Staff", staffSchema);
