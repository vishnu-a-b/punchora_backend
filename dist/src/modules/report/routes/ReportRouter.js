"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReportController_1 = __importDefault(require("../controllers/ReportController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, CONTROL_ROOM } = roles_1.UserRole;
const router = (0, express_1.Router)();
const controller = new ReportController_1.default();
/**
 * @route   GET /v1/reports/location-compliance
 * @desc    Generate location compliance report
 * @access  Private - Super Admin, Control Room, Business Admin
 * @query   startDate, endDate, business (optional), department (optional)
 */
router.get("/location-compliance", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getLocationComplianceReport);
/**
 * @route   GET /v1/reports/attendance-anomalies
 * @desc    Generate attendance anomalies report
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 * @query   startDate, endDate, business (optional), department (optional)
 */
router.get("/attendance-anomalies", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getAttendanceAnomaliesReport);
/**
 * @route   GET /v1/reports/late-checkins
 * @desc    Generate late check-ins report
 * @access  Private - Super Admin, Control Room, Business Admin, HR Admin
 * @query   startDate, endDate, business (optional), threshold (optional, default 30)
 */
router.get("/late-checkins", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getLateCheckinsReport);
/**
 * @route   GET /v1/reports/alert-summary
 * @desc    Generate alert summary report
 * @access  Private - Super Admin, Control Room, Business Admin
 * @query   startDate, endDate, business (optional)
 */
router.get("/alert-summary", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getAlertSummaryReport);
/**
 * @route   GET /v1/reports/dashboard
 * @desc    Generate comprehensive dashboard report (all metrics)
 * @access  Private - Super Admin, Control Room, Business Admin
 * @query   startDate, endDate, business (optional)
 */
router.get("/dashboard", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]), businessScopingValidator_1.applyBusinessScoping, controller.getDashboardReport);
/**
 * @route   POST /v1/reports/export
 * @desc    Export a report to various formats (CSV, JSON, PDF)
 * @access  Private - Super Admin, Control Room, Business Admin
 * @body    { reportData: object, format: "csv" | "json" | "pdf" }
 */
router.post("/export", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, CONTROL_ROOM, BUSINESS_ADMIN]), controller.exportReport);
exports.default = router;
