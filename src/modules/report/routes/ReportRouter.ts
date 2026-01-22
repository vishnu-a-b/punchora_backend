import { Router } from "express";
import ReportController from "../controllers/ReportController";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM } = UserRole;

const router = Router();
const controller = new ReportController();

/**
 * @route   GET /v1/reports/location-compliance
 * @desc    Generate location compliance report
 * @access  Private - Super Admin, Control Room, Business Admin
 * @query   startDate, endDate, business (optional), department (optional)
 */
router.get(
  "/location-compliance",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]),
  applyBusinessScoping,
  controller.getLocationComplianceReport
);

/**
 * @route   GET /v1/reports/attendance-anomalies
 * @desc    Generate attendance anomalies report
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 * @query   startDate, endDate, business (optional), department (optional)
 */
router.get(
  "/attendance-anomalies",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.getAttendanceAnomaliesReport
);

/**
 * @route   GET /v1/reports/late-checkins
 * @desc    Generate late check-ins report
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 * @query   startDate, endDate, business (optional), threshold (optional, default 30)
 */
router.get(
  "/late-checkins",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  controller.getLateCheckinsReport
);

/**
 * @route   GET /v1/reports/alert-summary
 * @desc    Generate alert summary report
 * @access  Private - Super Admin, Control Room, Business Admin
 * @query   startDate, endDate, business (optional)
 */
router.get(
  "/alert-summary",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]),
  applyBusinessScoping,
  controller.getAlertSummaryReport
);

/**
 * @route   GET /v1/reports/dashboard
 * @desc    Generate comprehensive dashboard report (all metrics)
 * @access  Private - Super Admin, Control Room, Business Admin
 * @query   startDate, endDate, business (optional)
 */
router.get(
  "/dashboard",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]),
  applyBusinessScoping,
  controller.getDashboardReport
);

/**
 * @route   POST /v1/reports/export
 * @desc    Export a report to various formats (CSV, JSON, PDF)
 * @access  Private - Super Admin, Control Room, Business Admin
 * @body    { reportData: object, format: "csv" | "json" | "pdf" }
 */
router.post(
  "/export",
  authenticateUser,
  checkRole([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]),
  controller.exportReport
);

export default router;
