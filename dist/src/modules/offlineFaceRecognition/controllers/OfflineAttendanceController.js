"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineAttendanceController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = require("crypto");
class OfflineAttendanceController {
    constructor() {
        /**
         * POST /v1/offline-face/sync-attendance
         * Batch upload attendance records from mobile
         */
        this.syncAttendance = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { records } = req.body;
                // Validate input
                if (!records || !Array.isArray(records) || records.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: "records array is required and must not be empty",
                    });
                }
                // Limit batch size
                if (records.length > 100) {
                    return res.status(400).json({
                        success: false,
                        error: "Batch size cannot exceed 100 records",
                    });
                }
                const syncBatchId = (0, crypto_1.randomUUID)();
                const results = [];
                // Process each record
                for (const record of records) {
                    try {
                        // Validate record
                        const validation = this.validateAttendanceRecord(record);
                        if (!validation.valid) {
                            results.push({
                                localId: record.localId,
                                status: "failed",
                                error: validation.error,
                            });
                            continue;
                        }
                        // Create attendance record
                        // NOTE: Adjust this based on your actual Attendance model
                        const attendanceData = {
                            staffId: new mongoose_1.default.Types.ObjectId(record.staffId),
                            timestamp: new Date(record.timestamp),
                            type: record.type,
                            photoUrl: record.photoUrl,
                            location: record.location,
                            deviceId: record.deviceId,
                            syncBatchId,
                            source: "offline_mobile", // Mark as offline mobile source
                            createdAt: new Date(),
                        };
                        // Save to database
                        // const attendance = await Attendance.create(attendanceData);
                        // PLACEHOLDER: Replace with actual Attendance model save
                        // For now, we'll just log it
                        console.log("📝 Would save attendance:", attendanceData);
                        // Simulate successful save
                        const mockId = new mongoose_1.default.Types.ObjectId();
                        results.push({
                            localId: record.localId,
                            status: "success",
                            serverId: mockId.toString(),
                        });
                        console.log(`✅ Synced attendance for staff ${record.staffId} at ${new Date(record.timestamp).toISOString()}`);
                    }
                    catch (error) {
                        console.error(`❌ Failed to sync record ${record.localId}:`, error);
                        results.push({
                            localId: record.localId,
                            status: "failed",
                            error: error.message || "Unknown error",
                        });
                    }
                }
                // Calculate summary
                const successful = results.filter((r) => r.status === "success").length;
                const failed = results.filter((r) => r.status === "failed").length;
                const response = {
                    success: failed === 0,
                    results,
                    summary: {
                        total: records.length,
                        successful,
                        failed,
                    },
                };
                console.log(`📊 Batch sync complete: ${successful}/${records.length} successful`);
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error syncing attendance:", error);
                next(error);
            }
        });
        /**
         * GET /v1/offline-face/attendance-status/:syncBatchId
         * Get status of a sync batch
         */
        this.getAttendanceSyncStatus = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { syncBatchId } = req.params;
                // Query attendance records by syncBatchId
                // const records = await Attendance.find({ syncBatchId });
                // PLACEHOLDER: Replace with actual query
                res.status(200).json({
                    success: true,
                    syncBatchId,
                    count: 0, // records.length
                    message: "Sync batch status endpoint (placeholder)",
                });
            }
            catch (error) {
                console.error("Error getting sync status:", error);
                next(error);
            }
        });
    }
    /**
     * Validate attendance record
     */
    validateAttendanceRecord(record) {
        if (!record.localId) {
            return { valid: false, error: "localId is required" };
        }
        if (!record.staffId || !mongoose_1.default.Types.ObjectId.isValid(record.staffId)) {
            return { valid: false, error: "Valid staffId is required" };
        }
        if (!record.timestamp || isNaN(record.timestamp)) {
            return { valid: false, error: "Valid timestamp is required" };
        }
        if (!record.type || !["IN", "OUT"].includes(record.type)) {
            return { valid: false, error: "type must be 'IN' or 'OUT'" };
        }
        // Validate timestamp is not in future
        if (record.timestamp > Date.now()) {
            return { valid: false, error: "Timestamp cannot be in the future" };
        }
        // Validate timestamp is not too old (e.g., more than 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (record.timestamp < thirtyDaysAgo) {
            return { valid: false, error: "Timestamp is too old (>30 days)" };
        }
        return { valid: true };
    }
}
exports.OfflineAttendanceController = OfflineAttendanceController;
exports.default = new OfflineAttendanceController();
