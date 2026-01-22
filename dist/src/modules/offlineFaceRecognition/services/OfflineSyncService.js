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
const mongoose_1 = __importDefault(require("mongoose"));
const Attendance_1 = require("../../attendance/models/Attendance");
const attendanceStatus_1 = require("../../base/enums/attendanceStatus");
const SyncBatch_1 = require("../models/SyncBatch");
class OfflineSyncService {
    /**
     * Process a batch of offline attendance records
     */
    processBatch(records, userId, batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const startTime = Date.now();
            // Create sync batch tracking record
            const syncBatch = yield SyncBatch_1.SyncBatch.create({
                batchId,
                userId,
                deviceId: (_a = records[0]) === null || _a === void 0 ? void 0 : _a.deviceId,
                totalRecords: records.length,
                processedRecords: 0,
                failedRecords: 0,
                status: SyncBatch_1.SyncBatchStatus.PROCESSING,
                startedAt: new Date(),
            });
            const results = [];
            const errorSummary = [];
            // Process each record
            for (const record of records) {
                try {
                    const result = yield this.processRecord(record, batchId);
                    results.push(result);
                    if (result.status === "success") {
                        syncBatch.processedRecords++;
                    }
                    else {
                        syncBatch.failedRecords++;
                        errorSummary.push({
                            localId: record.localId,
                            error: result.error,
                            timestamp: new Date(),
                        });
                    }
                }
                catch (error) {
                    syncBatch.failedRecords++;
                    results.push({
                        localId: record.localId,
                        status: "failed",
                        error: error.message || "Unknown error",
                    });
                    errorSummary.push({
                        localId: record.localId,
                        error: error.message,
                        timestamp: new Date(),
                    });
                }
            }
            // Update sync batch with final status
            const endTime = Date.now();
            syncBatch.completedAt = new Date();
            syncBatch.durationMs = endTime - startTime;
            // Assign error summary - cast to any to avoid DocumentArray type issues
            syncBatch.errorSummary = errorSummary;
            // Determine final status
            if (syncBatch.failedRecords === 0) {
                syncBatch.status = SyncBatch_1.SyncBatchStatus.COMPLETED;
            }
            else if (syncBatch.processedRecords === 0) {
                syncBatch.status = SyncBatch_1.SyncBatchStatus.FAILED;
            }
            else {
                syncBatch.status = SyncBatch_1.SyncBatchStatus.PARTIAL;
            }
            yield syncBatch.save();
            return {
                results,
                batchSummary: {
                    batchId: syncBatch.batchId,
                    total: syncBatch.totalRecords,
                    successful: syncBatch.processedRecords,
                    failed: syncBatch.failedRecords,
                    successRate: syncBatch.get("successRate"),
                    durationMs: syncBatch.durationMs,
                    status: syncBatch.status,
                },
            };
        });
    }
    /**
     * Process a single offline attendance record
     */
    processRecord(record, batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Generate idempotency key from record data
                const idempotencyKey = this.generateIdempotencyKey(record);
                // Check for duplicate using idempotency key
                const existing = yield Attendance_1.Attendance.findOne({ idempotencyKey });
                if (existing) {
                    return {
                        localId: record.localId,
                        status: "success",
                        serverId: existing._id.toString(),
                        error: "Duplicate - already synced",
                    };
                }
                const recordDate = new Date(record.timestamp);
                if (record.type === "IN") {
                    // Create new attendance record for check-in
                    const attendance = yield this.createCheckIn(record, recordDate, idempotencyKey, batchId);
                    return {
                        localId: record.localId,
                        status: "success",
                        serverId: attendance._id.toString(),
                    };
                }
                else {
                    // Handle check-out
                    const attendance = yield this.handleCheckOut(record, recordDate, idempotencyKey, batchId);
                    return {
                        localId: record.localId,
                        status: "success",
                        serverId: attendance._id.toString(),
                    };
                }
            }
            catch (error) {
                console.error(`Failed to process record ${record.localId}:`, error);
                return {
                    localId: record.localId,
                    status: "failed",
                    error: error.message || "Unknown error",
                };
            }
        });
    }
    /**
     * Create check-in attendance record
     */
    createCheckIn(record, recordDate, idempotencyKey, batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Check for existing check-in on the same day
            const startOfDay = new Date(recordDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(recordDate);
            endOfDay.setHours(23, 59, 59, 999);
            const existingToday = yield Attendance_1.Attendance.findOne({
                staff: record.staffId,
                date: { $gte: startOfDay, $lte: endOfDay },
            });
            if (existingToday) {
                throw new Error("Check-in already exists for this date - use check-out instead");
            }
            // Detect GPS spoofing
            const flagged = ((_a = record.location) === null || _a === void 0 ? void 0 : _a.mocked) === true;
            const flagReason = flagged ? "gps_spoofing" : undefined;
            // Create new attendance record
            const attendance = yield Attendance_1.Attendance.create({
                staff: new mongoose_1.default.Types.ObjectId(record.staffId),
                date: recordDate,
                checkInTime: recordDate,
                checkInPhoto: record.photoUrl,
                checkInLocation: record.location
                    ? {
                        latitude: record.location.lat,
                        longitude: record.location.lng,
                        accuracy: record.location.accuracy,
                        altitude: record.location.altitude,
                        mocked: record.location.mocked,
                    }
                    : undefined,
                status: attendanceStatus_1.AttendanceStatus.checkedIn,
                idempotencyKey,
                flagged,
                flagReason,
                flagNotes: flagged
                    ? `Offline sync - GPS spoofing detected. Batch: ${batchId}`
                    : undefined,
            });
            console.log(`✅ Created check-in for staff ${record.staffId} at ${recordDate.toISOString()}`);
            return attendance;
        });
    }
    /**
     * Handle check-out - update existing record or create new one
     */
    handleCheckOut(record, recordDate, idempotencyKey, batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Look for existing check-in within the last 24 hours
            const twentyFourHoursAgo = new Date(recordDate.getTime() - 24 * 60 * 60 * 1000);
            const existingCheckIn = yield Attendance_1.Attendance.findOne({
                staff: record.staffId,
                status: attendanceStatus_1.AttendanceStatus.checkedIn,
                checkInTime: { $gte: twentyFourHoursAgo, $lte: recordDate },
            }).sort({ checkInTime: -1 });
            if (existingCheckIn) {
                // Update existing record with check-out
                const flagged = existingCheckIn.flagged || ((_a = record.location) === null || _a === void 0 ? void 0 : _a.mocked) === true;
                existingCheckIn.checkOutTime = recordDate;
                existingCheckIn.checkOutPhoto = record.photoUrl;
                existingCheckIn.checkOutLocation = record.location
                    ? {
                        latitude: record.location.lat,
                        longitude: record.location.lng,
                        accuracy: record.location.accuracy,
                        altitude: record.location.altitude,
                        mocked: record.location.mocked,
                    }
                    : undefined;
                existingCheckIn.status = attendanceStatus_1.AttendanceStatus.present;
                existingCheckIn.flagged = flagged;
                if (((_b = record.location) === null || _b === void 0 ? void 0 : _b.mocked) && !existingCheckIn.flagReason) {
                    existingCheckIn.flagReason = "gps_spoofing";
                    existingCheckIn.flagNotes = `Offline sync - GPS spoofing on checkout. Batch: ${batchId}`;
                }
                yield existingCheckIn.save();
                console.log(`✅ Updated check-out for staff ${record.staffId} at ${recordDate.toISOString()}`);
                return existingCheckIn;
            }
            else {
                // No check-in found - create orphan check-out record
                const flagged = true; // Flag orphan check-outs
                const attendance = yield Attendance_1.Attendance.create({
                    staff: new mongoose_1.default.Types.ObjectId(record.staffId),
                    date: recordDate,
                    checkOutTime: recordDate,
                    checkOutPhoto: record.photoUrl,
                    checkOutLocation: record.location
                        ? {
                            latitude: record.location.lat,
                            longitude: record.location.lng,
                            accuracy: record.location.accuracy,
                            altitude: record.location.altitude,
                            mocked: record.location.mocked,
                        }
                        : undefined,
                    status: attendanceStatus_1.AttendanceStatus.present,
                    idempotencyKey,
                    flagged,
                    flagReason: "missing_checkout",
                    flagNotes: `Offline sync - Check-out without check-in. Batch: ${batchId}`,
                });
                console.log(`⚠️ Created orphan check-out for staff ${record.staffId} at ${recordDate.toISOString()}`);
                return attendance;
            }
        });
    }
    /**
     * Generate idempotency key from record data
     */
    generateIdempotencyKey(record) {
        // Combine staff ID, timestamp, and type for unique key
        return `offline_${record.staffId}_${record.timestamp}_${record.type}_${record.localId}`;
    }
    /**
     * Get sync batch status
     */
    getSyncBatchStatus(batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            const syncBatch = yield SyncBatch_1.SyncBatch.findOne({ batchId }).lean();
            if (!syncBatch) {
                return null;
            }
            // Get associated attendance records
            const attendanceRecords = yield Attendance_1.Attendance.find({
                idempotencyKey: { $regex: `^offline_.*` },
                createdAt: {
                    $gte: new Date(syncBatch.startedAt.getTime() - 1000),
                    $lte: syncBatch.completedAt || new Date(),
                },
            })
                .select("staff checkInTime checkOutTime status flagged")
                .populate("staff", "name")
                .limit(100)
                .lean();
            return Object.assign(Object.assign({}, syncBatch), { successRate: syncBatch.totalRecords > 0
                    ? (syncBatch.processedRecords / syncBatch.totalRecords) * 100
                    : 0, records: attendanceRecords });
        });
    }
    /**
     * Get sync history for a user
     */
    getUserSyncHistory(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 10) {
            const batches = yield SyncBatch_1.SyncBatch.find({ userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
            return batches.map((batch) => ({
                batchId: batch.batchId,
                totalRecords: batch.totalRecords,
                processedRecords: batch.processedRecords,
                failedRecords: batch.failedRecords,
                status: batch.status,
                successRate: batch.totalRecords > 0
                    ? (batch.processedRecords / batch.totalRecords) * 100
                    : 0,
                startedAt: batch.startedAt,
                completedAt: batch.completedAt,
                durationMs: batch.durationMs,
            }));
        });
    }
}
exports.default = OfflineSyncService;
