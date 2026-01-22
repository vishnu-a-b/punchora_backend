"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuditController_1 = __importDefault(require("../controllers/AuditController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const { SUPER_ADMIN } = roles_1.UserRole;
const router = (0, express_1.Router)();
const controller = new AuditController_1.default();
/**
 * @route   GET /v1/audit/logs
 * @desc    Get audit logs with filters and pagination
 * @access  Private - Super Admin only
 * @query   userId, resource, resourceId, action, business, status, startDate, endDate, skip, limit
 */
router.get("/logs", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.getLogs);
/**
 * @route   GET /v1/audit/logs/:id
 * @desc    Get single audit log by ID
 * @access  Private - Super Admin only
 */
router.get("/logs/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.getLogById);
/**
 * @route   GET /v1/audit/users/:userId
 * @desc    Get audit logs for specific user
 * @access  Private - Super Admin only
 */
router.get("/users/:userId", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.getUserLogs);
/**
 * @route   GET /v1/audit/resources/:type/:id
 * @desc    Get audit logs for specific resource
 * @access  Private - Super Admin only
 * @params  type (e.g., "staff", "attendance", "user")
 *          id (resource ID)
 */
router.get("/resources/:type/:id", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.getResourceLogs);
/**
 * @route   GET /v1/audit/stats
 * @desc    Get audit log statistics
 * @access  Private - Super Admin only
 * @query   userId, business, startDate, endDate
 */
router.get("/stats", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.getStatistics);
/**
 * @route   GET /v1/audit/recent
 * @desc    Get recent activity (last 24 hours)
 * @access  Private - Super Admin only
 * @query   limit (default: 100)
 */
router.get("/recent", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.getRecentActivity);
/**
 * @route   GET /v1/audit/search
 * @desc    Search audit logs by text
 * @access  Private - Super Admin only
 * @query   q (search term), skip, limit
 */
router.get("/search", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.searchLogs);
/**
 * @route   POST /v1/audit/export
 * @desc    Export audit logs to CSV or JSON
 * @access  Private - Super Admin only
 * @body    { format: "csv" | "json", filter: AuditLogFilter }
 */
router.post("/export", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN]), controller.exportLogs);
exports.default = router;
