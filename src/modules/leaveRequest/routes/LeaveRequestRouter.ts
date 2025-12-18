import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import authorizeUser from "../../../middlewares/authorizeUser";
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
import RolesEnum from "../../base/enums/roles";
import { checkRole, checkLeaveApprovalPermission, applyDataFilters } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";

const router = express.Router();
const controller = new LeaveRequestController();

router.use(authenticateUser);

const authorization = authorizeUser({
  allowedRoles: [RolesEnum.staff],
});

router.get(
  "/",
  leaveRequestListDoc,
  setFilterParams(leaveRequestFilterFields),
  controller.get
);

router.post(
  "/",
  authorization,
  leaveRequestCreateDoc,
  leaveRequestCreateValidator,
  controller.create
);
router.put(
  "/accept-or-reject/:id",
  authorization,
  leaveRequestAcceptorRejectDoc,
  leaveRequestUpdateValidator,
  controller.accept
);
router.put(
  "/:id",
  authorization,
  leaveRequestUpdateDoc,
  leaveRequestUpdateValidator,
  controller.update
);

router.delete("/:id", leaveRequestDeleteDoc, authorization, controller.delete);

// Get pending approvals (filtered by role)
router.get(
  "/pending-approvals",
  checkRole([
    UserRole.DEPARTMENT_HEAD,
    UserRole.HR_ADMIN,
    UserRole.BUSINESS_ADMIN,
    UserRole.SUPER_ADMIN
  ]),
  applyDataFilters,
  controller.getPendingApprovals
);

// Department Head approval routes
router.post(
  "/:id/approve-dept-head",
  checkLeaveApprovalPermission(1),
  controller.approveLeaveDeptHead
);

router.post(
  "/:id/reject-dept-head",
  checkLeaveApprovalPermission(1),
  controller.rejectLeaveDeptHead
);

// HR approval routes
router.post(
  "/:id/approve-hr",
  checkLeaveApprovalPermission(2),
  controller.approveLeaveHR
);

router.post(
  "/:id/reject-hr",
  checkLeaveApprovalPermission(2),
  controller.rejectLeaveHR
);

export default router;
