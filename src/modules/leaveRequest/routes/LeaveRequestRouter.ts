import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole, checkLeaveApprovalPermission, applyDataFilters } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import setFilterParams from "../../../middlewares/setFilterParams";
import { leaveRequestListDoc } from "../docs/leaveRequestListDoc";
import { leaveRequestFilterFields } from "../models/LeaveRequest";
import { leaveRequestCreateDoc } from "../docs/leaveRequestCreateDoc";
import { leaveRequestCreateValidator } from "../validators/leaveRequestCreateValidator";
import { leaveRequestUpdateDoc } from "../docs/leaveRequestUpdateDoc";
import { leaveRequestUpdateValidator } from "../validators/leaveRequestUpdateValidator";
import { leaveRequestAcceptorRejectDoc } from "../docs/leaveRequestAcceptorRejectDoc";
import LeaveRequestController from "../controllers/LeaveRequestController";
import { leaveRequestDeleteDoc } from "../docs/leaveRequestDeleteDoc";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = UserRole;

const router = express.Router();
const controller = new LeaveRequestController();

router.use(authenticateUser);

// Get all leave requests - Admins see all in business, staff see own
router.get(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  applyBusinessScoping,
  leaveRequestListDoc,
  setFilterParams(leaveRequestFilterFields),
  controller.get
);

// Create leave request - Anyone can apply for leave
router.post(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  leaveRequestCreateDoc,
  leaveRequestCreateValidator,
  controller.create
);
// Accept or reject leave - Legacy endpoint, use specific approval routes instead
router.put(
  "/accept-or-reject/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  leaveRequestAcceptorRejectDoc,
  leaveRequestUpdateValidator,
  controller.accept
);
// Update leave request - Staff updates own, admins can update any
router.put(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  applyBusinessScoping,
  leaveRequestUpdateDoc,
  leaveRequestUpdateValidator,
  controller.update
);

// Delete leave request - Staff deletes own, admins can delete any
router.delete(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  applyBusinessScoping,
  leaveRequestDeleteDoc,
  controller.delete
);

// Get pending approvals (filtered by role)
router.get(
  "/pending-approvals",
  checkRole([DEPARTMENT_HEAD, HR_ADMIN, BUSINESS_ADMIN, SUPER_ADMIN]),
  applyBusinessScoping,
  applyDataFilters,
  controller.getPendingApprovals
);

// Department Head approval routes (Level 1)
router.post(
  "/:id/approve-dept-head",
  checkLeaveApprovalPermission(1),
  applyBusinessScoping,
  controller.approveLeaveDeptHead
);

router.post(
  "/:id/reject-dept-head",
  checkLeaveApprovalPermission(1),
  applyBusinessScoping,
  controller.rejectLeaveDeptHead
);

// HR approval routes (Level 2 - Final approval)
router.post(
  "/:id/approve-hr",
  checkLeaveApprovalPermission(2),
  applyBusinessScoping,
  controller.approveLeaveHR
);

router.post(
  "/:id/reject-hr",
  checkLeaveApprovalPermission(2),
  applyBusinessScoping,
  controller.rejectLeaveHR
);

export default router;
