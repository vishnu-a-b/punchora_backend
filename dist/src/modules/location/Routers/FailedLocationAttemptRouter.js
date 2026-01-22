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
const FailedLocationAttemptController_1 = __importDefault(require("../controllers/FailedLocationAttemptController"));
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM, STAFF } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new FailedLocationAttemptController_1.default();
// Get failed attempts by date - Admins, control room, and dept heads
router.get("/by-date", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, controller.filterByDate);
// Get staff with location disabled - Admins and control room
router.get("/location-disabled", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, controller.getStaffWithLocationDisabled);
// Get location failure summary - Admins and control room
router.get("/failure-summary", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, controller.getLocationFailureSummary);
// Get all failed attempts - Admins, control room, and dept heads
router.get("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, controller.list);
// Create bulk failed attempts - Staff reports own, admins can report for anyone
router.post("/bulk", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), controller.insertMany);
// Create failed attempt - Staff reports own, admins can report for anyone
router.post("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, STAFF]), controller.create);
// Get one failed attempt - Admins, control room, dept heads, and self
router.get("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, DEPARTMENT_HEAD, CONTROL_ROOM, STAFF]), businessScopingValidator_1.applyBusinessScoping, controller.getOne);
// Update failed attempt - Admins only
router.put("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.update);
// Delete failed attempt - Admins only
router.delete("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.delete);
exports.default = router;
