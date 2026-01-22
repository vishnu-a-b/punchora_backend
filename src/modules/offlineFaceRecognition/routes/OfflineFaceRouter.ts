import { Router } from "express";
import StaffEmbeddingController from "../controllers/StaffEmbeddingController";
import OfflineAttendanceController from "../controllers/OfflineAttendanceController";
import { authenticateUser } from "../../authentication/middlewares/authenticateUser";
import { checkRole } from "../../../middlewares/checkPermission";
import { UserRole } from "../../../constants/roles";
import { applyBusinessScoping } from "../../../middlewares/businessScopingValidator";

const { SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF } = UserRole;

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

const router = Router();

// ==================== Staff Embedding Routes ====================

/**
 * @route   POST /v1/offline-face/upload-staff-photo
 * @desc    Upload staff photo, generate ONNX embedding, save both
 * @access  Private - Business Admin, HR Admin, Super Admin only
 * @body    { staffId: string, photo: string (base64) }
 */
router.post(
  "/upload-staff-photo",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  StaffEmbeddingController.uploadStaffPhoto
);

/**
 * @route   GET /v1/offline-face/staff-embeddings
 * @desc    Get staff embeddings with pagination (for mobile sync)
 * @access  Private - Business Admin, HR Admin, Staff (mobile app sync)
 * @query   { page?: number, limit?: number, lastSync?: ISO timestamp }
 */
router.get(
  "/staff-embeddings",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  applyBusinessScoping,
  StaffEmbeddingController.getStaffEmbeddings
);

/**
 * @route   GET /v1/offline-face/staff-list
 * @desc    Get minimal staff list (id, name, photo) for offline app
 * @access  Private - Business Admin, HR Admin, Staff (mobile app sync)
 */
router.get(
  "/staff-list",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  applyBusinessScoping,
  StaffEmbeddingController.getStaffList
);

/**
 * @route   DELETE /v1/offline-face/staff-embedding/:staffId
 * @desc    Delete staff embedding
 * @access  Private - Business Admin, HR Admin, Super Admin only
 */
router.delete(
  "/staff-embedding/:staffId",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN]),
  applyBusinessScoping,
  StaffEmbeddingController.deleteStaffEmbedding
);

// ==================== Attendance Sync Routes ====================

/**
 * @route   POST /v1/offline-face/sync-attendance
 * @desc    Batch upload attendance records from mobile
 * @access  Private - Staff (mobile app), Business Admin, HR Admin
 * @body    { records: AttendanceRecord[] }
 */
router.post(
  "/sync-attendance",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  applyBusinessScoping,
  OfflineAttendanceController.syncAttendance
);

/**
 * @route   GET /v1/offline-face/sync-status/:batchId
 * @desc    Get status of a sync batch
 * @access  Private - Staff (mobile app), Business Admin, HR Admin
 */
router.get(
  "/sync-status/:batchId",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  OfflineAttendanceController.getSyncBatchStatus
);

/**
 * @route   GET /v1/offline-face/sync-history
 * @desc    Get sync history for current user
 * @access  Private - Staff (mobile app), Business Admin, HR Admin
 * @query   { limit?: number }
 */
router.get(
  "/sync-history",
  authenticateUser,
  checkRole([SUPER_ADMIN, BUSINESS_ADMIN, HR_ADMIN, STAFF]),
  OfflineAttendanceController.getUserSyncHistory
);

export default router;
