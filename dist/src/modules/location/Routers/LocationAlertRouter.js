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
const LocationAlertController_1 = __importDefault(require("../controllers/LocationAlertController"));
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM } = roles_1.UserRole;
const router = express_1.default.Router();
const controller = new LocationAlertController_1.default();
// Get all alerts - Business Admin, HR Admin, Control Room can view
router.get("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, controller.list);
// Create alert - Admin only
router.post("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.create);
// Acknowledge alert - Admins and Control Room can acknowledge
router.post("/:id/acknowledge", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, controller.acknowledge);
// Resolve alert - Admin only
router.post("/:id/resolve", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.resolve);
// Auto-generate alerts from failed attempts - Admin only
router.post("/generate/failed-attempts", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.generateFromFailedAttempts);
// Auto-generate alerts from mocked GPS - Admin only
router.post("/generate/mocked-gps", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.generateFromMockedGPS);
// Cleanup old alerts - Super Admin only
router.delete("/cleanup", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.cleanup);
exports.default = router;
