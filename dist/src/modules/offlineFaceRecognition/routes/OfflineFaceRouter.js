"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StaffEmbeddingController_1 = __importDefault(require("../controllers/StaffEmbeddingController"));
const OfflineAttendanceController_1 = __importDefault(require("../controllers/OfflineAttendanceController"));
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const checkPermission_1 = require("../../../middlewares/checkPermission");
const roles_1 = require("../../../constants/roles");
const businessScopingValidator_1 = require("../../../middlewares/businessScopingValidator");
const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF } = roles_1.UserRole;
/**
 * OfflineFaceRouter
 * Routes for ONNX-based offline face recognition system
 *
 * Prefix: /v1/offline-face
 *
 * IMPORTANT: These routes are SEPARATE from existing face-api.js routes
 * They handle the new ONNX/mobile offline recognition system
 *
 * SECURITY: All routes now require authentication and proper authorization
 */
const router = (0, express_1.Router)();
// ==================== Staff Embedding Routes ====================
/**
 * @route   POST /v1/offline-face/upload-staff-photo
 * @desc    Upload staff photo, generate ONNX embedding, save both
 * @access  Private - Business Admin, HR Admin, Super Admin only
 * @body    { staffId: string, photo: string (base64) }
 */
router.post("/upload-staff-photo", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, StaffEmbeddingController_1.default.uploadStaffPhoto);
/**
 * @route   GET /v1/offline-face/staff-embeddings
 * @desc    Get staff embeddings with pagination (for mobile sync)
 * @access  Private - Business Admin, HR Admin, Staff (mobile app sync)
 * @query   { page?: number, limit?: number, lastSync?: ISO timestamp }
 */
router.get("/staff-embeddings", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), businessScopingValidator_1.applyBusinessScoping, StaffEmbeddingController_1.default.getStaffEmbeddings);
/**
 * @route   GET /v1/offline-face/staff-list
 * @desc    Get minimal staff list (id, name, photo) for offline app
 * @access  Private - Business Admin, HR Admin, Staff (mobile app sync)
 */
router.get("/staff-list", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), businessScopingValidator_1.applyBusinessScoping, StaffEmbeddingController_1.default.getStaffList);
/**
 * @route   DELETE /v1/offline-face/staff-embedding/:staffId
 * @desc    Delete staff embedding
 * @access  Private - Business Admin, HR Admin, Super Admin only
 */
router.delete("/staff-embedding/:staffId", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]), businessScopingValidator_1.applyBusinessScoping, StaffEmbeddingController_1.default.deleteStaffEmbedding);
// ==================== Attendance Sync Routes ====================
/**
 * @route   POST /v1/offline-face/sync-attendance
 * @desc    Batch upload attendance records from mobile
 * @access  Private - Staff (mobile app), Business Admin, HR Admin
 * @body    { records: AttendanceRecord[] }
 */
router.post("/sync-attendance", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), businessScopingValidator_1.applyBusinessScoping, OfflineAttendanceController_1.default.syncAttendance);
/**
 * @route   GET /v1/offline-face/sync-status/:batchId
 * @desc    Get status of a sync batch
 * @access  Private - Staff (mobile app), Business Admin, HR Admin
 */
router.get("/sync-status/:batchId", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), OfflineAttendanceController_1.default.getSyncBatchStatus);
/**
 * @route   GET /v1/offline-face/sync-history
 * @desc    Get sync history for current user
 * @access  Private - Staff (mobile app), Business Admin, HR Admin
 * @query   { limit?: number }
 */
router.get("/sync-history", authenticateUser_1.authenticateUser, (0, checkPermission_1.checkRole)([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]), OfflineAttendanceController_1.default.getUserSyncHistory);
exports.default = router;
