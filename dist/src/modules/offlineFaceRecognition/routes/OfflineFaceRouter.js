"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StaffEmbeddingController_1 = __importDefault(require("../controllers/StaffEmbeddingController"));
const OfflineAttendanceController_1 = __importDefault(require("../controllers/OfflineAttendanceController"));
/**
 * OfflineFaceRouter
 * Routes for ONNX-based offline face recognition system
 *
 * Prefix: /v1/offline-face
 *
 * IMPORTANT: These routes are SEPARATE from existing face-api.js routes
 * They handle the new ONNX/mobile offline recognition system
 */
const router = (0, express_1.Router)();
// ==================== Staff Embedding Routes ====================
/**
 * @route   POST /v1/offline-face/upload-staff-photo
 * @desc    Upload staff photo, generate ONNX embedding, save both
 * @access  Public (add auth middleware if needed)
 * @body    { staffId: string, photo: string (base64) }
 */
router.post("/upload-staff-photo", StaffEmbeddingController_1.default.uploadStaffPhoto);
/**
 * @route   GET /v1/offline-face/staff-embeddings
 * @desc    Get staff embeddings with pagination (for mobile sync)
 * @access  Public (add auth middleware if needed)
 * @query   { page?: number, limit?: number, lastSync?: ISO timestamp }
 */
router.get("/staff-embeddings", StaffEmbeddingController_1.default.getStaffEmbeddings);
/**
 * @route   GET /v1/offline-face/staff-list
 * @desc    Get minimal staff list (id, name, photo) for offline app
 * @access  Public (add auth middleware if needed)
 */
router.get("/staff-list", StaffEmbeddingController_1.default.getStaffList);
/**
 * @route   DELETE /v1/offline-face/staff-embedding/:staffId
 * @desc    Delete staff embedding
 * @access  Public (add auth middleware if needed)
 */
router.delete("/staff-embedding/:staffId", StaffEmbeddingController_1.default.deleteStaffEmbedding);
// ==================== Attendance Sync Routes ====================
/**
 * @route   POST /v1/offline-face/sync-attendance
 * @desc    Batch upload attendance records from mobile
 * @access  Public (add auth middleware if needed)
 * @body    { records: AttendanceRecord[] }
 */
router.post("/sync-attendance", OfflineAttendanceController_1.default.syncAttendance);
/**
 * @route   GET /v1/offline-face/attendance-status/:syncBatchId
 * @desc    Get status of a sync batch
 * @access  Public (add auth middleware if needed)
 */
router.get("/attendance-status/:syncBatchId", OfflineAttendanceController_1.default.getAttendanceSyncStatus);
exports.default = router;
