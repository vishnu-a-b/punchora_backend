"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const authorizeUser_1 = __importDefault(require("../../../middlewares/authorizeUser"));
const setFilterParams_1 = __importDefault(require("../../../middlewares/setFilterParams"));
const leaveRequestListDoc_1 = require("../docs/leaveRequestListDoc");
const LeaveRequest_1 = require("../models/LeaveRequest");
const leaveRequestCreateDoc_1 = require("../docs/leaveRequestCreateDoc");
const leaveRequestCreateValidator_1 = require("../validators/leaveRequestCreateValidator");
const leaveRequestUpdateDoc_1 = require("../docs/leaveRequestUpdateDoc");
const leaveRequestUpdateValidator_1 = require("../validators/leaveRequestUpdateValidator");
const leaveRequestAcceptorRejectDoc_1 = require("../docs/leaveRequestAcceptorRejectDoc");
const LeaveRequestController_1 = __importDefault(require("../controllers/LeaveRequestController"));
const leaveRequestDeleteDoc_1 = require("../docs/leaveRequestDeleteDoc");
const roles_1 = __importDefault(require("../../base/enums/roles"));
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_2 = require("../../../constants/roles");
const router = express_1.default.Router();
const controller = new LeaveRequestController_1.default();
router.use(authenticateUser_1.authenticateUser);
const authorization = (0, authorizeUser_1.default)({
    allowedRoles: [roles_1.default.staff],
});
router.get("/", leaveRequestListDoc_1.leaveRequestListDoc, (0, setFilterParams_1.default)(LeaveRequest_1.leaveRequestFilterFields), controller.get);
router.post("/", authorization, leaveRequestCreateDoc_1.leaveRequestCreateDoc, leaveRequestCreateValidator_1.leaveRequestCreateValidator, controller.create);
router.put("/accept-or-reject/:id", authorization, leaveRequestAcceptorRejectDoc_1.leaveRequestAcceptorRejectDoc, leaveRequestUpdateValidator_1.leaveRequestUpdateValidator, controller.accept);
router.put("/:id", authorization, leaveRequestUpdateDoc_1.leaveRequestUpdateDoc, leaveRequestUpdateValidator_1.leaveRequestUpdateValidator, controller.update);
router.delete("/:id", leaveRequestDeleteDoc_1.leaveRequestDeleteDoc, authorization, controller.delete);
// Get pending approvals (filtered by role)
router.get("/pending-approvals", (0, checkPermission_1.checkRole)([
    roles_2.UserRole.DEPARTMENT_HEAD,
    roles_2.UserRole.HR_ADMIN,
    roles_2.UserRole.BUSINESS_ADMIN,
    roles_2.UserRole.SUPER_ADMIN
]), checkPermission_1.applyDataFilters, controller.getPendingApprovals);
// Department Head approval routes
router.post("/:id/approve-dept-head", (0, checkPermission_1.checkLeaveApprovalPermission)(1), controller.approveLeaveDeptHead);
router.post("/:id/reject-dept-head", (0, checkPermission_1.checkLeaveApprovalPermission)(1), controller.rejectLeaveDeptHead);
// HR approval routes
router.post("/:id/approve-hr", (0, checkPermission_1.checkLeaveApprovalPermission)(2), controller.approveLeaveHR);
router.post("/:id/reject-hr", (0, checkPermission_1.checkLeaveApprovalPermission)(2), controller.rejectLeaveHR);
exports.default = router;
