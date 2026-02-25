"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const setFilterParams_1 = __importDefault(require("../../../middlewares/setFilterParams"));
const mergeScopingFilters_1 = require("../../../middlewares/mergeScopingFilters");
const staffListDoc_1 = require("../docs/staffListDoc");
const Staff_1 = require("../models/Staff");
const staffCountDoc_1 = require("../docs/staffCountDoc");
const staffDetailsDoc_1 = require("../docs/staffDetailsDoc");
const staffCreateDoc_1 = require("../docs/staffCreateDoc");
const staffCreateValidator_1 = require("../validators/staffCreateValidator");
const staffUpdateDoc_1 = require("../docs/staffUpdateDoc");
const staffUpdateValidator_1 = require("../validators/staffUpdateValidator");
const StaffController_1 = __importDefault(require("../controllers/StaffController"));
const staffDeleteDoc_1 = require("../docs/staffDeleteDoc");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new StaffController_1.default();
router.use(authenticateUser_1.authenticateUser);
// Get all staff - Admins see all in business, dept heads see department
router.get("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, staffListDoc_1.staffListDoc, (0, setFilterParams_1.default)(Staff_1.staffFilterFields), mergeScopingFilters_1.mergeScopingFilters, controller.get);
// Count staff - Super admin only
router.get("/count-documents", (0, checkPermission_1.checkRole)([SUPER_ADMIN]), staffCountDoc_1.staffCountDoc, controller.countTotalDocuments);
// Get staff with attendance - Admins and dept heads
router.get("/get-attendance", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, (0, setFilterParams_1.default)(Staff_1.staffFilterFields), mergeScopingFilters_1.mergeScopingFilters, staffListDoc_1.staffListDoc, controller.getWithAttendance);
// Get staff by user ID - Admins, dept heads, and self
router.get("/user/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), businessScopingValidator_1.applyBusinessScoping, staffDetailsDoc_1.staffDetailsDoc, controller.getWithUserId);
// Get one staff - Admins, dept heads, and self
router.get("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), businessScopingValidator_1.applyBusinessScoping, staffDetailsDoc_1.staffDetailsDoc, controller.getOne);
// Create staff - Admins (including HR) can hire new staff
router.post("/", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, staffCreateDoc_1.staffCreateDoc, staffCreateValidator_1.staffCreateValidator, controller.create);
// Update staff - Admins (including HR) and staff can update
router.put("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), businessScopingValidator_1.applyBusinessScoping, staffUpdateDoc_1.staffUpdateDoc, staffUpdateValidator_1.staffUpdateValidator, controller.update);
// Update push token - Staff can update their own push token
router.put("/:id/push-token", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), controller.updatePushToken);
// Delete staff - Admins (including HR) can remove staff
router.delete("/:id", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, staffDeleteDoc_1.staffDeleteDoc, controller.delete);
/**
 * PHASE 4: Multi-Department Support Routes
 */
const StaffDepartmentController_1 = __importDefault(require("../controllers/StaffDepartmentController"));
const deptController = new StaffDepartmentController_1.default();
// Get all staff in a department (primary + additional)
router.get("/department/:departmentId", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, deptController.getStaffInDepartment);
// Get staff's all departments
router.get("/:id/departments", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD]), businessScopingValidator_1.applyBusinessScoping, deptController.getStaffDepartments);
// Add staff to additional department
router.post("/:id/departments", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, deptController.addStaffToDepartment);
// Remove staff from additional department
router.delete("/:id/departments/:departmentId", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, deptController.removeStaffFromDepartment);
// Change staff's primary department
router.put("/:id/primary-department", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, deptController.changePrimaryDepartment);
// Get department staff counts
router.get("/departments/counts", (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, deptController.getDepartmentStaffCounts);
exports.default = router;
