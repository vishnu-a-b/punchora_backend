import mongoose from "mongoose";
import ModelFilterInterface from "../../../interfaces/ModelFilterInterface";
import { AttendanceStatus } from "../../base/enums/attendanceStatus";

const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    checkInPhoto: { type: String, required: false, maxLength: 200 },
    checkOutPhoto: { type: String, required: false, maxLength: 200 },
    status: {
      type: String,
      maxLength: 20,
      enum: Object.values(AttendanceStatus),
    },
  },
  { timestamps: true }
);

export const attendanceFilterFields: ModelFilterInterface = {
  filterFields: ["staff", "status"],
  searchFields: [],
  sortFields: ["createdAt", "updatedAt"],
};

export const Attendance = mongoose.model("Attendance", attendanceSchema);
