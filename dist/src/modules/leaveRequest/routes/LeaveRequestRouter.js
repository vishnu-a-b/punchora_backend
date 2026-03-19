"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const mergeScopingFilters_1 = require("../../../middlewares/mergeScopingFilters");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
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
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new LeaveRequestController_1.default();
router.use(authenticateUser_1.authenticateUser);
// Get all leave requests - Admins see all in business, staff see own
router.get("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), businessScopingValidator_1.applyBusinessScoping, leaveRequestListDoc_1.leaveRequestListDoc, (0, setFilterParams_1.default)(LeaveRequest_1.leaveRequestFilterFields), mergeScopingFilters_1.mergeScopingFilters, controller.get);
// Create leave request - Anyone can apply for leave
router.post("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), leaveRequestCreateDoc_1.leaveRequestCreateDoc, leaveRequestCreateValidator_1.leaveRequestCreateValidator, controller.create);
// Accept or reject leave - Legacy endpoint, use specific approval routes instead
router.put("/accept-or-reject/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, leaveRequestAcceptorRejectDoc_1.leaveRequestAcceptorRejectDoc, leaveRequestUpdateValidator_1.leaveRequestUpdateValidator, controller.accept);
// Update leave request - Staff updates own, admins can update any
router.put("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), businessScopingValidator_1.applyBusinessScoping, leaveRequestUpdateDoc_1.leaveRequestUpdateDoc, leaveRequestUpdateValidator_1.leaveRequestUpdateValidator, controller.update);
// Delete leave request - Staff deletes own, admins can delete any
router.delete("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), businessScopingValidator_1.applyBusinessScoping, leaveRequestDeleteDoc_1.leaveRequestDeleteDoc, controller.delete);
// Get pending approvals (filtered by role)
router.get("/pending-approvals", (0, checkPermission_1.checkRole)([DEPARTMENT_HEAD, HR_ADMIN, BUSINESS_ADMIN, SUPER_ADMIN]), businessScopingValidator_1.applyBusinessScoping, checkPermission_1.applyDataFilters, controller.getPendingApprovals);
// Department Head approval routes (Level 1)
router.post("/:id/approve-dept-head", (0, checkPermission_1.checkLeaveApprovalPermission)(1), businessScopingValidator_1.applyBusinessScoping, controller.approveLeaveDeptHead);
router.post("/:id/reject-dept-head", (0, checkPermission_1.checkLeaveApprovalPermission)(1), businessScopingValidator_1.applyBusinessScoping, controller.rejectLeaveDeptHead);
// HR approval routes (Level 2 - Final approval)
router.post("/:id/approve-hr", (0, checkPermission_1.checkLeaveApprovalPermission)(2), businessScopingValidator_1.applyBusinessScoping, controller.approveLeaveHR);
router.post("/:id/reject-hr", (0, checkPermission_1.checkLeaveApprovalPermission)(2), businessScopingValidator_1.applyBusinessScoping, controller.rejectLeaveHR);
exports.default = router;
