"use strict";
/**
 * Conflict Resolution Service
 * Detects and resolves conflicts during offline sync
 * Phase 6: Mobile Sync Optimization
 */
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
exports.ResolutionStrategy = exports.ConflictType = void 0;
const Attendance_1 = require("../modules/attendance/models/Attendance");
const AuditService_1 = __importDefault(require("../modules/audit/services/AuditService"));
var ConflictType;
(function (ConflictType) {
    ConflictType["DUPLICATE"] = "duplicate";
    ConflictType["TIMESTAMP_MISMATCH"] = "timestamp_mismatch";
    ConflictType["DATA_DIVERGENCE"] = "data_divergence";
    ConflictType["ORDERING_ISSUE"] = "ordering_issue";
})(ConflictType || (exports.ConflictType = ConflictType = {}));
var ResolutionStrategy;
(function (ResolutionStrategy) {
    ResolutionStrategy["LOCAL_WINS"] = "local_wins";
    ResolutionStrategy["SERVER_WINS"] = "server_wins";
    ResolutionStrategy["LAST_WRITE_WINS"] = "last_write_wins";
    ResolutionStrategy["MANUAL_REVIEW"] = "manual_review";
    ResolutionStrategy["MERGE"] = "merge";
})(ResolutionStrategy || (exports.ResolutionStrategy = ResolutionStrategy = {}));
class ConflictResolutionService {
    constructor() {
        this.auditService = new AuditService_1.default();
    }
    /**
     * Detect conflicts between local and server records
     */
    detectConflicts(records) {
        return __awaiter(this, void 0, void 0, function* () {
            const conflicts = [];
            for (const record of records) {
                const conflict = yield this.checkForConflict(record);
                if (conflict) {
                    conflicts.push(conflict);
                }
            }
            return conflicts;
        });
    }
    /**
     * Check if a single record has conflicts
     */
    checkForConflict(localRecord) {
        return __awaiter(this, void 0, void 0, function* () {
            const { staffId, timestamp, type } = localRecord;
            // Find existing attendance record for the same day
            const recordDate = new Date(timestamp);
            const startOfDay = new Date(recordDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(recordDate);
            endOfDay.setHours(23, 59, 59, 999);
            const existingRecord = yield Attendance_1.Attendance.findOne({
                staff: staffId,
                date: { $gte: startOfDay, $lte: endOfDay }
            });
            if (!existingRecord) {
                return null; // No conflict
            }
            // Check for duplicate
            const isDuplicate = this.isDuplicate(localRecord, existingRecord);
            if (isDuplicate) {
                return {
                    localRecord,
                    serverRecord: existingRecord,
                    conflictType: ConflictType.DUPLICATE,
                    resolution: ResolutionStrategy.SERVER_WINS,
                    reason: 'Record already exists on server'
                };
            }
            // Check for timestamp mismatch
            const timestampConflict = this.hasTimestampConflict(localRecord, existingRecord);
            if (timestampConflict) {
                return {
                    localRecord,
                    serverRecord: existingRecord,
                    conflictType: ConflictType.TIMESTAMP_MISMATCH,
                    resolution: ResolutionStrategy.LAST_WRITE_WINS,
                    reason: 'Different timestamps for same event',
                    metadata: {
                        localTime: timestamp,
                        serverTime: this.getServerTimestamp(existingRecord, type)
                    }
                };
            }
            // Check for data divergence
            const dataDivergence = this.hasDataDivergence(localRecord, existingRecord);
            if (dataDivergence) {
                return {
                    localRecord,
                    serverRecord: existingRecord,
                    conflictType: ConflictType.DATA_DIVERGENCE,
                    resolution: ResolutionStrategy.MANUAL_REVIEW,
                    reason: 'Data mismatch between local and server',
                    metadata: dataDivergence
                };
            }
            return null;
        });
    }
    /**
     * Check if record is a duplicate
     */
    isDuplicate(localRecord, serverRecord) {
        var _a, _b;
        const type = (localRecord.type || '').toLowerCase();
        const localTimestamp = new Date(localRecord.timestamp).getTime();
        let serverTimestamp;
        if (type === 'check-in' || type === 'in') {
            serverTimestamp = (_a = serverRecord.checkInTime) === null || _a === void 0 ? void 0 : _a.getTime();
        }
        else if (type === 'check-out' || type === 'out') {
            serverTimestamp = (_b = serverRecord.checkOutTime) === null || _b === void 0 ? void 0 : _b.getTime();
        }
        if (!serverTimestamp) {
            return false;
        }
        // Consider duplicate if timestamps are within 5 seconds
        const timeDiff = Math.abs(localTimestamp - serverTimestamp);
        return timeDiff < 5000;
    }
    /**
     * Check for timestamp conflicts
     */
    hasTimestampConflict(localRecord, serverRecord) {
        var _a, _b;
        const type = (localRecord.type || '').toLowerCase();
        const localTimestamp = new Date(localRecord.timestamp).getTime();
        let serverTimestamp;
        if (type === 'check-in' || type === 'in') {
            serverTimestamp = (_a = serverRecord.checkInTime) === null || _a === void 0 ? void 0 : _a.getTime();
        }
        else if (type === 'check-out' || type === 'out') {
            serverTimestamp = (_b = serverRecord.checkOutTime) === null || _b === void 0 ? void 0 : _b.getTime();
        }
        if (!serverTimestamp) {
            return false;
        }
        // Conflict if timestamps differ by more than 5 seconds but less than 1 hour
        const timeDiff = Math.abs(localTimestamp - serverTimestamp);
        return timeDiff > 5000 && timeDiff < 3600000;
    }
    /**
     * Check for data divergence
     */
    hasDataDivergence(localRecord, serverRecord) {
        const divergence = {};
        let hasDivergence = false;
        // Check location divergence
        if (localRecord.location && serverRecord.checkInLocation) {
            const localLat = localRecord.location.lat || localRecord.location.latitude;
            const serverLat = serverRecord.checkInLocation.latitude;
            const localLng = localRecord.location.lng || localRecord.location.longitude;
            const serverLng = serverRecord.checkInLocation.longitude;
            const latDiff = Math.abs(localLat - serverLat);
            const lngDiff = Math.abs(localLng - serverLng);
            // Significant location difference (>0.001 degrees ~= 100m)
            if (latDiff > 0.001 || lngDiff > 0.001) {
                divergence.location = {
                    local: { lat: localLat, lng: localLng },
                    server: { lat: serverLat, lng: serverLng }
                };
                hasDivergence = true;
            }
        }
        return hasDivergence ? divergence : null;
    }
    /**
     * Get server timestamp for comparison
     */
    getServerTimestamp(serverRecord, type) {
        var _a, _b;
        const recordType = type.toLowerCase();
        if (recordType === 'check-in' || recordType === 'in') {
            return (_a = serverRecord.checkInTime) === null || _a === void 0 ? void 0 : _a.getTime();
        }
        else if (recordType === 'check-out' || recordType === 'out') {
            return (_b = serverRecord.checkOutTime) === null || _b === void 0 ? void 0 : _b.getTime();
        }
        return undefined;
    }
    /**
     * Resolve conflicts using configured strategies
     */
    resolveConflicts(conflicts) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolved = [];
            const manualReviewItems = [];
            let autoResolved = 0;
            for (const conflict of conflicts) {
                const resolution = yield this.applyResolution(conflict);
                if (resolution.requiresManualReview) {
                    manualReviewItems.push(conflict);
                }
                else {
                    resolved.push(resolution.record);
                    autoResolved++;
                    // Log auto-resolution to audit
                    yield this.auditService.logAsync({
                        action: 'CONFLICT_AUTO_RESOLVED',
                        resource: 'OfflineSync',
                        metadata: {
                            conflictType: conflict.conflictType,
                            resolution: conflict.resolution,
                            reason: conflict.reason,
                            staffId: conflict.localRecord.staffId
                        },
                        status: 'success'
                    });
                }
            }
            return {
                resolved,
                conflicts: manualReviewItems,
                autoResolved,
                manualReview: manualReviewItems.length
            };
        });
    }
    /**
     * Apply resolution strategy to a conflict
     */
    applyResolution(conflict) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            switch (conflict.resolution) {
                case ResolutionStrategy.LOCAL_WINS:
                    return {
                        record: conflict.localRecord,
                        requiresManualReview: false
                    };
                case ResolutionStrategy.SERVER_WINS:
                    return {
                        record: conflict.serverRecord,
                        requiresManualReview: false
                    };
                case ResolutionStrategy.LAST_WRITE_WINS:
                    const localTime = new Date(conflict.localRecord.timestamp).getTime();
                    const serverTime = ((_b = (_a = conflict.serverRecord) === null || _a === void 0 ? void 0 : _a.updatedAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0;
                    return {
                        record: localTime > serverTime ? conflict.localRecord : conflict.serverRecord,
                        requiresManualReview: false
                    };
                case ResolutionStrategy.MERGE:
                    const merged = this.mergeRecords(conflict.localRecord, conflict.serverRecord);
                    return {
                        record: merged,
                        requiresManualReview: false
                    };
                case ResolutionStrategy.MANUAL_REVIEW:
                default:
                    return {
                        record: conflict.localRecord,
                        requiresManualReview: true
                    };
            }
        });
    }
    /**
     * Merge local and server records
     */
    mergeRecords(localRecord, serverRecord) {
        // Prefer local data for most fields, server for IDs
        return Object.assign(Object.assign(Object.assign({}, serverRecord), localRecord), { _id: serverRecord === null || serverRecord === void 0 ? void 0 : serverRecord._id, mergedAt: new Date(), mergeSource: 'conflict_resolution' });
    }
    /**
     * Get conflict statistics
     */
    getConflictStatistics(conflicts) {
        const byType = {
            [ConflictType.DUPLICATE]: 0,
            [ConflictType.TIMESTAMP_MISMATCH]: 0,
            [ConflictType.DATA_DIVERGENCE]: 0,
            [ConflictType.ORDERING_ISSUE]: 0,
        };
        const byResolution = {
            [ResolutionStrategy.LOCAL_WINS]: 0,
            [ResolutionStrategy.SERVER_WINS]: 0,
            [ResolutionStrategy.LAST_WRITE_WINS]: 0,
            [ResolutionStrategy.MANUAL_REVIEW]: 0,
            [ResolutionStrategy.MERGE]: 0,
        };
        conflicts.forEach(conflict => {
            byType[conflict.conflictType]++;
            byResolution[conflict.resolution]++;
        });
        return {
            total: conflicts.length,
            byType,
            byResolution
        };
    }
}
exports.default = ConflictResolutionService;
