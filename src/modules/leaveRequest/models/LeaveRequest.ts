import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";
import { LeaveStatus } from "../../base/enums/leaveStatus";

const leaveRequestSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    leaveDates: {
      type: [Date],
      required: true,
    },
    remarks: { type: String },
    status: {
      type: String,
      required: true,
      maxLength: 20,
      default: LeaveStatus.pending,
    },
  },
  { timestamps: true }
);

export const leaveRequestFilterFields: ModelFilterInterface = {
  filterFields: ["staff", "department", "status"],
  searchFields: [],
  sortFields: ["createdAt", "updatedAt"],
};

export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
