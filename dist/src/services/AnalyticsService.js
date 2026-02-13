"use strict";
/**
 * Analytics Service
 * Provides real-time dashboard metrics and analytics
 * Phase 6: Admin Dashboard Enhancements
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
const Staff_1 = require("../modules/staff/models/Staff");
const Attendance_1 = require("../modules/attendance/models/Attendance");
const Alert_1 = require("../modules/alert/models/Alert");
const Activity_1 = require("../modules/activity/models/Activity");
const SyncBatch_1 = require("../modules/offlineFaceRecognition/models/SyncBatch");
const CacheService_1 = __importDefault(require("./CacheService"));
class AnalyticsService {
    constructor() {
        this.cacheService = CacheService_1.default;
        this.CACHE_TTL = 60; // 1 minute cache for real-time metrics
        // cacheService is already initialized as singleton
    }
    /**
     * Get dashboard metrics for a business
     * Parallel aggregation for performance
     */
    getDashboardMetrics(businessId, dateRange) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `analytics:dashboard:${businessId}:${Date.now() - (Date.now() % 60000)}`;
            // Try cache first (1 minute TTL)
            const cached = yield this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            // Run all aggregations in parallel for performance
            const [attendanceMetrics, alertMetrics, activityMetrics, staffMetrics, syncMetrics] = yield Promise.all([
                this.getAttendanceMetrics(businessId, today, tomorrow),
                this.getAlertMetrics(businessId, today, tomorrow),
                this.getActivityMetrics(businessId, today, tomorrow),
                this.getStaffMetrics(businessId),
                this.getSyncMetrics(today, tomorrow)
            ]);
            const metrics = {
                attendance: attendanceMetrics,
                alerts: alertMetrics,
                activities: activityMetrics,
                staff: staffMetrics,
                sync: syncMetrics
            };
            // Cache for 1 minute
            yield this.cacheService.set(cacheKey, metrics, this.CACHE_TTL);
            return metrics;
        });
    }
    /**
     * Get attendance metrics
     */
    getAttendanceMetrics(businessId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const staffList = yield Staff_1.Staff.find({ business: businessId, isActive: true });
            const staffIds = staffList.map(s => s._id);
            const [presentToday, lateCheckins, missingCheckouts, flaggedRecords, onTimeRecords] = yield Promise.all([
                Attendance_1.Attendance.countDocuments({
                    staff: { $in: staffIds },
                    date: { $gte: startDate, $lt: endDate },
                    checkInTime: { $exists: true }
                }),
                Attendance_1.Attendance.countDocuments({
                    staff: { $in: staffIds },
                    date: { $gte: startDate, $lt: endDate },
                    flagged: true,
                    flagReason: { $regex: /late/i }
                }),
                Attendance_1.Attendance.countDocuments({
                    staff: { $in: staffIds },
                    date: { $gte: startDate, $lt: endDate },
                    checkInTime: { $exists: true },
                    checkOutTime: { $exists: false }
                }),
                Attendance_1.Attendance.countDocuments({
                    staff: { $in: staffIds },
                    date: { $gte: startDate, $lt: endDate },
                    flagged: true
                }),
                Attendance_1.Attendance.countDocuments({
                    staff: { $in: staffIds },
                    date: { $gte: startDate, $lt: endDate },
                    flagged: false
                })
            ]);
            const totalAttendance = presentToday;
            const onTimeRate = totalAttendance > 0 ? (onTimeRecords / totalAttendance) * 100 : 100;
            return {
                presentToday,
                lateCheckins,
                missingCheckouts,
                flaggedRecords,
                onTimeRate: Math.round(onTimeRate * 10) / 10
            };
        });
    }
    /**
     * Get alert metrics
     */
    getAlertMetrics(businessId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const [activeAlerts, criticalAlerts, resolvedToday, acknowledgedToday, topAlertTypes] = yield Promise.all([
                Alert_1.Alert.countDocuments({
                    business: businessId,
                    status: Alert_1.AlertStatus.ACTIVE
                }),
                Alert_1.Alert.countDocuments({
                    business: businessId,
                    status: Alert_1.AlertStatus.ACTIVE,
                    severity: 'critical'
                }),
                Alert_1.Alert.countDocuments({
                    business: businessId,
                    status: Alert_1.AlertStatus.RESOLVED,
                    resolvedAt: { $gte: startDate, $lt: endDate }
                }),
                Alert_1.Alert.countDocuments({
                    business: businessId,
                    acknowledgedAt: { $gte: startDate, $lt: endDate }
                }),
                Alert_1.Alert.aggregate([
                    {
                        $match: {
                            business: businessId,
                            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                        }
                    },
                    {
                        $group: {
                            _id: '$type',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ])
            ]);
            return {
                activeAlerts,
                criticalAlerts,
                resolvedToday,
                acknowledgedToday,
                topAlertTypes: topAlertTypes.map(t => ({ type: t._id, count: t.count }))
            };
        });
    }
    /**
     * Get activity metrics
     */
    getActivityMetrics(businessId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [ongoingActivities, completedToday, avgDuration, topActivityTypes] = yield Promise.all([
                Activity_1.Activity.countDocuments({
                    business: businessId,
                    status: Activity_1.ActivityStatus.STARTED
                }),
                Activity_1.Activity.countDocuments({
                    business: businessId,
                    status: Activity_1.ActivityStatus.ENDED,
                    endTime: { $gte: startDate, $lt: endDate }
                }),
                Activity_1.Activity.aggregate([
                    {
                        $match: {
                            business: businessId,
                            status: Activity_1.ActivityStatus.ENDED,
                            duration: { $exists: true, $gt: 0 },
                            endTime: { $gte: startDate, $lt: endDate }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avgDuration: { $avg: '$duration' }
                        }
                    }
                ]),
                Activity_1.Activity.aggregate([
                    {
                        $match: {
                            business: businessId,
                            startTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                        }
                    },
                    {
                        $group: {
                            _id: '$type',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ])
            ]);
            const averageDuration = ((_a = avgDuration[0]) === null || _a === void 0 ? void 0 : _a.avgDuration) || 0;
            return {
                ongoingActivities,
                completedToday,
                averageDuration: Math.round(averageDuration * 10) / 10,
                topActivityTypes: topActivityTypes.map(t => ({ type: t._id, count: t.count }))
            };
        });
    }
    /**
     * Get staff metrics
     */
    getStaffMetrics(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [totalActive, onDuty, withAlerts] = yield Promise.all([
                Staff_1.Staff.countDocuments({
                    business: businessId,
                    isActive: true
                }),
                Attendance_1.Attendance.aggregate([
                    {
                        $match: {
                            date: { $gte: today },
                            checkInTime: { $exists: true },
                            checkOutTime: { $exists: false }
                        }
                    },
                    {
                        $lookup: {
                            from: 'staff',
                            localField: 'staff',
                            foreignField: '_id',
                            as: 'staffDoc'
                        }
                    },
                    {
                        $match: {
                            'staffDoc.business': businessId
                        }
                    },
                    {
                        $count: 'total'
                    }
                ]),
                Alert_1.Alert.aggregate([
                    {
                        $match: {
                            business: businessId,
                            status: Alert_1.AlertStatus.ACTIVE
                        }
                    },
                    {
                        $group: {
                            _id: '$staff'
                        }
                    },
                    {
                        $count: 'total'
                    }
                ])
            ]);
            return {
                totalActive,
                onDuty: ((_a = onDuty[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                onLeave: 0, // TODO: Implement leave tracking
                withAlerts: ((_b = withAlerts[0]) === null || _b === void 0 ? void 0 : _b.total) || 0
            };
        });
    }
    /**
     * Get sync metrics
     */
    getSyncMetrics(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [pendingBatches, lastSync, failedSyncsToday, successfulSyncsToday] = yield Promise.all([
                SyncBatch_1.SyncBatch.countDocuments({
                    status: 'processing'
                }),
                SyncBatch_1.SyncBatch.findOne().sort({ completedAt: -1 }).select('completedAt'),
                SyncBatch_1.SyncBatch.countDocuments({
                    status: 'failed',
                    startedAt: { $gte: startDate, $lt: endDate }
                }),
                SyncBatch_1.SyncBatch.countDocuments({
                    status: 'completed',
                    startedAt: { $gte: startDate, $lt: endDate }
                })
            ]);
            const totalSyncsToday = failedSyncsToday + successfulSyncsToday;
            const successRate = totalSyncsToday > 0
                ? (successfulSyncsToday / totalSyncsToday) * 100
                : 100;
            return {
                pendingBatches,
                lastSyncTime: (_a = lastSync === null || lastSync === void 0 ? void 0 : lastSync.completedAt) !== null && _a !== void 0 ? _a : undefined,
                failedSyncsToday,
                successRate: Math.round(successRate * 10) / 10
            };
        });
    }
    /**
     * Get trend data for charts
     */
    getTrendData(businessId_1, metric_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, metric, days = 7) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            let aggregation;
            switch (metric) {
                case 'attendance':
                    aggregation = yield this.getAttendanceTrend(businessId, startDate, endDate, days);
                    break;
                case 'alerts':
                    aggregation = yield this.getAlertTrend(businessId, startDate, endDate, days);
                    break;
                case 'activities':
                    aggregation = yield this.getActivityTrend(businessId, startDate, endDate, days);
                    break;
            }
            return aggregation;
        });
    }
    getAttendanceTrend(businessId, startDate, endDate, days) {
        return __awaiter(this, void 0, void 0, function* () {
            const staffList = yield Staff_1.Staff.find({ business: businessId });
            const staffIds = staffList.map(s => s._id);
            const trend = yield Attendance_1.Attendance.aggregate([
                {
                    $match: {
                        staff: { $in: staffIds },
                        date: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$date' }
                        },
                        value: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            return trend.map(t => ({ date: t._id, value: t.value }));
        });
    }
    getAlertTrend(businessId, startDate, endDate, days) {
        return __awaiter(this, void 0, void 0, function* () {
            const trend = yield Alert_1.Alert.aggregate([
                {
                    $match: {
                        business: businessId,
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        value: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            return trend.map(t => ({ date: t._id, value: t.value }));
        });
    }
    getActivityTrend(businessId, startDate, endDate, days) {
        return __awaiter(this, void 0, void 0, function* () {
            const trend = yield Activity_1.Activity.aggregate([
                {
                    $match: {
                        business: businessId,
                        startTime: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
                        },
                        value: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            return trend.map(t => ({ date: t._id, value: t.value }));
        });
    }
}
exports.default = AnalyticsService;
