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
const crypto_1 = require("crypto");
const OfflineSyncService_1 = __importDefault(require("../services/OfflineSyncService"));
const BadRequestError_1 = __importDefault(require("../../../errors/errorTypes/BadRequestError"));
const NotFoundError_1 = __importDefault(require("../../../errors/errorTypes/NotFoundError"));
const securityValidation_1 = require("../../../utils/securityValidation");
class OfflineAttendanceController {
    constructor() {
        this.syncService = new OfflineSyncService_1.default();
        /**
         * POST /v1/offline-face/sync-attendance
         * Batch upload attendance records from mobile
         */
        this.syncAttendance = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { records } = req.body;
                const user = req.user;
                // Validate user authentication
                if (!user || !user._id) {
                    throw new BadRequestError_1.default({ error: "User authentication required" });
                }
                // Validate input
                if (!records || !Array.isArray(records) || records.length === 0) {
                    throw new BadRequestError_1.default({
                        error: "records array is required and must not be empty",
                    });
                }
                // Limit batch size
                if (records.length > 100) {
                    throw new BadRequestError_1.default({
                        error: "Batch size cannot exceed 100 records",
                    });
                }
                console.log(`📥 Starting batch sync: ${records.length} records for user ${user._id}`);
                // Validate all records first
                const validationErrors = [];
                for (const record of records) {
                    const validation = this.validateAttendanceRecord(record);
                    if (!validation.valid) {
                        validationErrors.push({
                            localId: record.localId,
                            error: validation.error,
                        });
                    }
                }
                // If any validation errors, return them without processing
                if (validationErrors.length > 0) {
                    console.warn(`⚠️ Validation failed for ${validationErrors.length} records`);
                    return res.status(400).json({
                        success: false,
                        error: "Validation failed for some records",
                        validationErrors,
                    });
                }
                // Generate unique batch ID
                const syncBatchId = (0, crypto_1.randomUUID)();
                // Process batch using service
                const { results, batchSummary } = yield this.syncService.processBatch(records, user._id.toString(), syncBatchId);
                const response = {
                    success: batchSummary.failed === 0,
                    results,
                    summary: {
                        total: batchSummary.total,
                        successful: batchSummary.successful,
                        failed: batchSummary.failed,
                    },
                    batchId: syncBatchId,
                    batchStatus: batchSummary.status,
                    successRate: batchSummary.successRate,
                    durationMs: batchSummary.durationMs,
                };
                console.log(`📊 Batch sync complete: ${batchSummary.successful}/${batchSummary.total} successful (${batchSummary.successRate.toFixed(1)}%)`);
                res.status(200).json(response);
            }
            catch (error) {
                console.error("Error syncing attendance:", error);
                next(error);
            }
        });
        /**
         * GET /v1/offline-face/sync-status/:batchId
         * Get status of a sync batch
         */
        this.getSyncBatchStatus = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { batchId } = req.params;
                console.log(`📊 Fetching sync batch status for: ${batchId}`);
                const batchStatus = yield this.syncService.getSyncBatchStatus(batchId);
                if (!batchStatus) {
                    throw new NotFoundError_1.default({ error: "Sync batch not found" });
                }
                res.status(200).json({
                    success: true,
                    data: batchStatus,
                });
            }
            catch (error) {
                console.error("Error getting sync status:", error);
                next(error);
            }
        });
        /**
         * GET /v1/offline-face/sync-history
         * Get sync history for current user
         */
        this.getUserSyncHistory = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                if (!user || !user._id) {
                    throw new BadRequestError_1.default({ error: "User authentication required" });
                }
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                console.log(`📊 Fetching sync history for user: ${user._id}`);
                const history = yield this.syncService.getUserSyncHistory(user._id.toString(), limit);
                res.status(200).json({
                    success: true,
                    data: history,
                });
            }
            catch (error) {
                console.error("Error getting sync history:", error);
                next(error);
            }
        });
    }
    /**
     * Validate attendance record
     * PHASE 5 DAY 10: Enhanced with security validation utilities
     */
    validateAttendanceRecord(record) {
        // Validate localId
        if (!record.localId) {
            return { valid: false, error: "localId is required" };
        }
        // Validate staffId using ObjectIdValidator
        const staffIdValidation = securityValidation_1.ObjectIdValidator.isValidObjectId(record.staffId);
        if (!staffIdValidation.valid) {
            return { valid: false, error: `Invalid staffId: ${staffIdValidation.error}` };
        }
        // Validate timestamp using TimestampValidator
        const timestampValidation = securityValidation_1.TimestampValidator.isValidTimestamp(record.timestamp, {
            maxPastHours: 720, // 30 days
            maxFutureMinutes: 5 // Allow 5 minutes for clock skew
        });
        if (!timestampValidation.valid) {
            return { valid: false, error: `Invalid timestamp: ${timestampValidation.error}` };
        }
        // Validate type
        if (!record.type || !["IN", "OUT"].includes(record.type)) {
            return { valid: false, error: "type must be 'IN' or 'OUT'" };
        }
        // Validate GPS location if provided
        if (record.location) {
            const locationValidation = securityValidation_1.GPSValidator.isValidLocation(record.location);
            if (!locationValidation.valid) {
                return { valid: false, error: `Invalid location: ${locationValidation.error}` };
            }
            // Detect GPS spoofing patterns
            const spoofingCheck = securityValidation_1.GPSValidator.detectSpoofingPatterns(record.location);
            if (spoofingCheck.spoofed) {
                console.warn(`⚠️ GPS spoofing detected for record ${record.localId}: ${spoofingCheck.reasons.join(', ')}`);
                // Note: We don't reject spoofed GPS, just log and flag it
            }
        }
        return { valid: true };
    }
}
exports.OfflineAttendanceController = OfflineAttendanceController;
exports.default = new OfflineAttendanceController();
