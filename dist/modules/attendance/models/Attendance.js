"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = exports.attendanceFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const attendanceStatus_1 = require("../../base/enums/attendanceStatus");
const locationSchema = new mongoose_1.default.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
});
const attendanceSchema = new mongoose_1.default.Schema({
    staff: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Staff" },
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
    checkInLocation: { type: locationSchema },
    checkOutLocation: { type: locationSchema },
    status: {
        type: String,
        maxLength: 20,
        enum: Object.values(attendanceStatus_1.AttendanceStatus),
        default: attendanceStatus_1.AttendanceStatus.checkedIn,
    },
}, { timestamps: true });
exports.attendanceFilterFields = {
    filterFields: ["staff", "status"],
    searchFields: [],
    sortFields: ["createdAt", "updatedAt", "checkInTime"],
};
exports.Attendance = mongoose_1.default.model("Attendance", attendanceSchema);
