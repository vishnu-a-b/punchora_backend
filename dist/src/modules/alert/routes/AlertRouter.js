"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AlertController_1 = __importDefault(require("../controllers/AlertController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM } = roles_1.UserRole;
const router = (0, express_1.Router)();
const controller = new AlertController_1.default();
/**
 * @route   GET /v1/alerts
 * @desc    Get all alerts with filters and pagination
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 */
router.get("/", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, // Control room sees all, others see their business
controller.getAllAlerts);
/**
 * @route   GET /v1/alerts/active
 * @desc    Get only active alerts (not acknowledged or resolved)
 * @access  Private - Super Admin, Control Room
 */
router.get("/active", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM]), businessScopingValidator_1.applyBusinessScoping, controller.getActiveAlerts);
/**
 * @route   GET /v1/alerts/stats
 * @desc    Get alert statistics (counts by type, severity, status)
 * @access  Private - Super Admin, Control Room, Business Admin
 */
router.get("/stats", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getAlertStats);
/**
 * @route   GET /v1/alerts/staff/:staffId
 * @desc    Get alerts for a specific staff member
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 */
router.get("/staff/:staffId", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getStaffAlerts);
/**
 * @route   GET /v1/alerts/:id
 * @desc    Get a single alert by ID
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 */
router.get("/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getAlertById);
/**
 * @route   POST /v1/alerts/:id/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 */
router.post("/:id/acknowledge", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.acknowledgeAlert);
/**
 * @route   POST /v1/alerts/:id/resolve
 * @desc    Resolve an alert with resolution notes
 * @access  Private - Super Admin, Control Room, Business Admin
 */
router.post("/:id/resolve", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.resolveAlert);
/**
 * @route   POST /v1/alerts/:id/dismiss
 * @desc    Dismiss an alert (for false positives or low priority)
 * @access  Private - Super Admin, Control Room only
 */
router.post("/:id/dismiss", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM]), controller.dismissAlert);
exports.default = router;
