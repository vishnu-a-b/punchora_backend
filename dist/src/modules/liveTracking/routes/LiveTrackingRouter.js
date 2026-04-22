"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const LiveTrackingController_1 = __importDefault(require("../controllers/LiveTrackingController"));
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM, STAFF } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new LiveTrackingController_1.default();
// Admin: start a live tracking session for a staff member
router.post("/start", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), controller.startTracking);
// Admin: stop live tracking
router.delete("/stop/:staffId", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), controller.stopTracking);
// Admin: get all active sessions
router.get("/sessions", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), controller.getActiveSessions);
// Mobile: check if this staff is being tracked (polled by mobile app)
router.get("/active/:staffId", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM, STAFF]), controller.checkActive);
// Mobile: send live location (no DB write — broadcast only)
router.post("/location", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([STAFF, SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), controller.receiveLocation);
// Admin: get all outside-staff in a department with last known location
router.get("/department/:departmentId/staff", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), controller.getDepartmentStaff);
exports.default = router;
