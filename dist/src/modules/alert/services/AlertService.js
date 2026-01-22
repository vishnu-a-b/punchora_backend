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
const Alert_1 = require("../models/Alert");
const mongoose_1 = __importDefault(require("mongoose"));
class AlertService {
    /**
     * Create a new alert
     */
    createAlert(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check for duplicate alerts (same type, staff, within 1 hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const existingAlert = yield Alert_1.Alert.findOne({
                type: data.type,
                staff: data.staff,
                status: Alert_1.AlertStatus.ACTIVE,
                createdAt: { $gte: oneHourAgo },
            });
            if (existingAlert) {
                // Don't create duplicate - just update priority if higher
                if (data.priority && data.priority > existingAlert.priority) {
                    existingAlert.priority = data.priority;
                    yield existingAlert.save();
                }
                return existingAlert;
            }
            const alert = new Alert_1.Alert(Object.assign(Object.assign({}, data), { status: Alert_1.AlertStatus.ACTIVE, acknowledged: false, resolved: false, priority: data.priority || 3 }));
            yield alert.save();
            // Populate staff and business names
            yield alert.populate([
                { path: "staff", select: "name email" },
                { path: "business", select: "name" },
            ]);
            return alert;
        });
    }
    /**
     * Get alerts with filters and pagination
     */
    getAlerts(filter_1) {
        return __awaiter(this, arguments, void 0, function* (filter, options = {}) {
            const query = {};
            // Apply filters
            if (filter.business)
                query.business = filter.business;
            if (filter.staff)
                query.staff = filter.staff;
            if (filter.type)
                query.type = filter.type;
            if (filter.severity)
                query.severity = filter.severity;
            if (filter.status)
                query.status = filter.status;
            if (filter.acknowledged !== undefined)
                query.acknowledged = filter.acknowledged;
            if (filter.resolved !== undefined)
                query.resolved = filter.resolved;
            // Date range filter
            if (filter.startDate || filter.endDate) {
                query.createdAt = {};
                if (filter.startDate)
                    query.createdAt.$gte = filter.startDate;
                if (filter.endDate)
                    query.createdAt.$lte = filter.endDate;
            }
            const total = yield Alert_1.Alert.countDocuments(query);
            const alertsQuery = Alert_1.Alert.find(query);
            // Apply pagination
            if (options.skip)
                alertsQuery.skip(options.skip);
            if (options.limit)
                alertsQuery.limit(options.limit);
            // Apply sorting (default: priority desc, createdAt desc)
            alertsQuery.sort(options.sort || { priority: -1, createdAt: -1 });
            // Apply population
            if (options.populate !== false) {
                alertsQuery.populate([
                    { path: "staff", select: "name email" },
                    { path: "business", select: "name" },
                    { path: "department", select: "name" },
                    { path: "acknowledgedBy", select: "name email" },
                    { path: "resolvedBy", select: "name email" },
                ]);
            }
            const alerts = yield alertsQuery.exec();
            return { alerts, total };
        });
    }
    /**
     * Get active alerts (not acknowledged or resolved)
     */
    getActiveAlerts(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = { status: Alert_1.AlertStatus.ACTIVE };
            if (businessId)
                query.business = businessId;
            return Alert_1.Alert.find(query)
                .sort({ priority: -1, createdAt: -1 })
                .populate([
                { path: "staff", select: "name email" },
                { path: "business", select: "name" },
            ])
                .exec();
        });
    }
    /**
     * Get alert by ID
     */
    getAlertById(alertId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Alert_1.Alert.findById(alertId)
                .populate([
                { path: "staff", select: "name email phone" },
                { path: "business", select: "name" },
                { path: "department", select: "name" },
                { path: "acknowledgedBy", select: "name email" },
                { path: "resolvedBy", select: "name email" },
            ])
                .exec();
        });
    }
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const alert = yield Alert_1.Alert.findById(alertId);
            if (!alert) {
                throw new Error("Alert not found");
            }
            if (alert.acknowledged) {
                throw new Error("Alert already acknowledged");
            }
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date();
            alert.acknowledgedBy = new mongoose_1.default.Types.ObjectId(data.userId);
            alert.acknowledgedByName = data.userName;
            alert.status = Alert_1.AlertStatus.ACKNOWLEDGED;
            yield alert.save();
            return this.getAlertById(alertId);
        });
    }
    /**
     * Resolve an alert
     */
    resolveAlert(alertId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const alert = yield Alert_1.Alert.findById(alertId);
            if (!alert) {
                throw new Error("Alert not found");
            }
            if (alert.resolved) {
                throw new Error("Alert already resolved");
            }
            alert.resolved = true;
            alert.resolvedAt = new Date();
            alert.resolvedBy = new mongoose_1.default.Types.ObjectId(data.userId);
            alert.resolutionNotes = data.resolutionNotes;
            alert.status = Alert_1.AlertStatus.RESOLVED;
            yield alert.save();
            return this.getAlertById(alertId);
        });
    }
    /**
     * Dismiss an alert
     */
    dismissAlert(alertId) {
        return __awaiter(this, void 0, void 0, function* () {
            const alert = yield Alert_1.Alert.findById(alertId);
            if (!alert) {
                throw new Error("Alert not found");
            }
            alert.status = Alert_1.AlertStatus.DISMISSED;
            yield alert.save();
            return alert;
        });
    }
    /**
     * Get alert statistics
     */
    getAlertStats(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = {};
            if (businessId)
                match.business = new mongoose_1.default.Types.ObjectId(businessId);
            const stats = yield Alert_1.Alert.aggregate([
                { $match: match },
                {
                    $facet: {
                        byType: [
                            { $group: { _id: "$type", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                        ],
                        bySeverity: [
                            { $group: { _id: "$severity", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                        ],
                        byStatus: [
                            { $group: { _id: "$status", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                        ],
                        overview: [
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: 1 },
                                    active: {
                                        $sum: {
                                            $cond: [{ $eq: ["$status", "active"] }, 1, 0],
                                        },
                                    },
                                    acknowledged: {
                                        $sum: {
                                            $cond: [{ $eq: ["$acknowledged", true] }, 1, 0],
                                        },
                                    },
                                    resolved: {
                                        $sum: {
                                            $cond: [{ $eq: ["$resolved", true] }, 1, 0],
                                        },
                                    },
                                    avgPriority: { $avg: "$priority" },
                                },
                            },
                        ],
                    },
                },
            ]);
            return {
                byType: stats[0].byType,
                bySeverity: stats[0].bySeverity,
                byStatus: stats[0].byStatus,
                overview: stats[0].overview[0] || {
                    total: 0,
                    active: 0,
                    acknowledged: 0,
                    resolved: 0,
                    avgPriority: 0,
                },
            };
        });
    }
    /**
     * Auto-expire old alerts
     * Should be run as a cron job
     */
    expireOldAlerts() {
        return __awaiter(this, arguments, void 0, function* (hoursOld = 24) {
            const expiryDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
            const result = yield Alert_1.Alert.updateMany({
                status: Alert_1.AlertStatus.ACTIVE,
                acknowledged: false,
                createdAt: { $lt: expiryDate },
            }, {
                $set: { status: Alert_1.AlertStatus.DISMISSED },
            });
            return result.modifiedCount;
        });
    }
    /**
     * Delete old resolved/dismissed alerts
     * Should be run as a cron job for cleanup
     */
    cleanupOldAlerts() {
        return __awaiter(this, arguments, void 0, function* (daysOld = 30) {
            const cleanupDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
            const result = yield Alert_1.Alert.deleteMany({
                status: { $in: [Alert_1.AlertStatus.RESOLVED, Alert_1.AlertStatus.DISMISSED] },
                createdAt: { $lt: cleanupDate },
            });
            return result.deletedCount;
        });
    }
    /**
     * Get alert count for a staff member
     */
    getStaffAlertCount(staffId_1) {
        return __awaiter(this, arguments, void 0, function* (staffId, activeOnly = false) {
            const query = { staff: staffId };
            if (activeOnly)
                query.status = Alert_1.AlertStatus.ACTIVE;
            return Alert_1.Alert.countDocuments(query);
        });
    }
}
exports.default = AlertService;
