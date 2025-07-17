"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequest = exports.leaveRequestFilterFields = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const leaveStatus_1 = require("../../base/enums/leaveStatus");
const leaveRequestSchema = new mongoose_1.default.Schema({
    reason: { type: String, required: true },
    staff: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Staff" },
    department: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Department" },
    leaveDates: {
        type: [Date],
        required: true,
    },
    remarks: { type: String },
    status: {
        type: String,
        required: true,
        maxLength: 20,
        default: leaveStatus_1.LeaveStatus.pending,
    },
}, { timestamps: true });
exports.leaveRequestFilterFields = {
    filterFields: ["staff", "department", "status"],
    searchFields: [],
    sortFields: ["createdAt", "updatedAt"],
};
exports.LeaveRequest = mongoose_1.default.model("LeaveRequest", leaveRequestSchema);
