import { Router } from "express";
import AlertController from "../controllers/AlertController";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM } = UserRole;

const router = Router();
const controller = new AlertController();

/**
 * @route   GET /v1/alerts
 * @desc    Get all alerts with filters and pagination
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 */
router.get(
  "/",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping, // Control room sees all, others see their business
  controller.getAllAlerts
);

/**
 * @route   GET /v1/alerts/active
 * @desc    Get only active alerts (not acknowledged or resolved)
 * @access  Private - Super Admin, Control Room
 */
router.get(
  "/active",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM]),
  applyBusinessScoping,
  controller.getActiveAlerts
);

/**
 * @route   GET /v1/alerts/stats
 * @desc    Get alert statistics (counts by type, severity, status)
 * @access  Private - Super Admin, Control Room, Business Admin
 */
router.get(
  "/stats",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]),
  applyBusinessScoping,
  controller.getAlertStats
);

/**
 * @route   GET /v1/alerts/staff/:staffId
 * @desc    Get alerts for a specific staff member
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 */
router.get(
  "/staff/:staffId",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.getStaffAlerts
);

/**
 * @route   GET /v1/alerts/:id
 * @desc    Get a single alert by ID
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 */
router.get(
  "/:id",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.getAlertById
);

/**
 * @route   POST /v1/alerts/:id/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 */
router.post(
  "/:id/acknowledge",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.acknowledgeAlert
);

/**
 * @route   POST /v1/alerts/:id/resolve
 * @desc    Resolve an alert with resolution notes
 * @access  Private - Super Admin, Control Room, Business Admin
 */
router.post(
  "/:id/resolve",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]),
  applyBusinessScoping,
  controller.resolveAlert
);

/**
 * @route   POST /v1/alerts/:id/dismiss
 * @desc    Dismiss an alert (for false positives or low priority)
 * @access  Private - Super Admin, Control Room only
 */
router.post(
  "/:id/dismiss",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM]),
  controller.dismissAlert
);

export default router;
