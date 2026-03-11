import express from "express";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";
import setFilterParams from "../../../middlewares/setFilterParams";
import { mergeScopingFilters } from "../../../middlewares/mergeScopingFilters";
import { staffListDoc } from "../docs/staffListDoc";
import { staffFilterFields } from "../models/Staff";
import { staffCountDoc } from "../docs/staffCountDoc";
import { staffDetailsDoc } from "../docs/staffDetailsDoc";
import { staffCreateDoc } from "../docs/staffCreateDoc";
import { staffCreateValidator } from "../validators/staffCreateValidator";
import { staffUpdateDoc } from "../docs/staffUpdateDoc";
import { staffUpdateValidator } from "../validators/staffUpdateValidator";
import StaffController from "../controllers/StaffController";
import { staffDeleteDoc } from "../docs/staffDeleteDoc";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF, CONTROL_ROOM } = UserRole;

const router = express.Router();
const controller = new StaffController();

router.use(authenticateUser);

// Get all staff - Admins see all in business, dept heads see department, control room sees all
router.get(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]),
  applyBusinessScoping,
  staffListDoc,
  setFilterParams(staffFilterFields),
  mergeScopingFilters,
  controller.get
);

// Count staff - Super admin only
router.get(
  "/count-documents",
  checkRole([SUPER_ADMIN]),
  staffCountDoc,
  controller.countTotalDocuments
);

// Get staff with attendance - Admins, dept heads, and control room
router.get(
  "/get-attendance",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]),
  applyBusinessScoping,
  setFilterParams(staffFilterFields),
  mergeScopingFilters,
  staffListDoc,
  controller.getWithAttendance
);

// Get staff by user ID - Admins, dept heads, and self
router.get(
  "/user/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  applyBusinessScoping,
  staffDetailsDoc,
  controller.getWithUserId
);

// Get one staff - Admins, dept heads, and self
router.get(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  applyBusinessScoping,
  staffDetailsDoc,
  controller.getOne
);
// Create staff - Admins (including HR) can hire new staff
router.post(
  "/",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  staffCreateDoc,
  staffCreateValidator,
  controller.create
);

// Update staff - Admins (including HR) and staff can update
router.put(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  applyBusinessScoping,
  staffUpdateDoc,
  staffUpdateValidator,
  controller.update
);

// Update push token - Staff can update their own push token
router.put(
  "/:id/push-token",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]),
  controller.updatePushToken
);

// Delete staff - Admins (including HR) can remove staff
router.delete(
  "/:id",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  staffDeleteDoc,
  controller.delete
);

/**
 * PHASE 4: Multi-Department Support Routes
 */
import StaffDepartmentController from "../controllers/StaffDepartmentController";
const deptController = new StaffDepartmentController();

// Get all staff in a department (primary + additional)
router.get(
  "/department/:departmentId",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  deptController.getStaffInDepartment
);

// Get staff's all departments
router.get(
  "/:id/departments",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]),
  applyBusinessScoping,
  deptController.getStaffDepartments
);

// Add staff to additional department
router.post(
  "/:id/departments",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  deptController.addStaffToDepartment
);

// Remove staff from additional department
router.delete(
  "/:id/departments/:departmentId",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  deptController.removeStaffFromDepartment
);

// Change staff's primary department
router.put(
  "/:id/primary-department",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  deptController.changePrimaryDepartment
);

// Get department staff counts
router.get(
  "/departments/counts",
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  deptController.getDepartmentStaffCounts
);

export default router;
