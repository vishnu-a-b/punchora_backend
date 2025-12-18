"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveStatus = void 0;
var LeaveStatus;
(function (LeaveStatus) {
    LeaveStatus["pending"] = "pending";
    LeaveStatus["pending_hr_approval"] = "pending_hr_approval";
    LeaveStatus["approved"] = "approved";
    LeaveStatus["rejected"] = "rejected";
    LeaveStatus["rejected_by_dept_head"] = "rejected_by_dept_head";
    LeaveStatus["rejected_by_hr"] = "rejected_by_hr";
})(LeaveStatus || (exports.LeaveStatus = LeaveStatus = {}));
