"use strict";
/**
 * Audit Service
 *
 * Handles all audit logging operations.
 * Provides methods to log actions, query logs, and generate statistics.
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
Object.defineProperty(exports, "__esModule", { value: true });
const AuditLog_1 = require("../models/AuditLog");
class AuditService {
    /**
     * Log an action to the audit trail
     * This is the primary method called throughout the application
     */
    log(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const auditLog = new AuditLog_1.AuditLog({
                    action: data.action,
                    resource: data.resource,
                    resourceId: data.resourceId,
                    userId: data.userId,
                    userName: data.userName,
                    userRole: data.userRole,
                    userEmail: data.userEmail,
                    business: data.business,
                    department: data.department,
                    changes: data.changes,
                    metadata: data.metadata || {},
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    endpoint: data.endpoint,
                    method: data.method,
                    status: data.status || "success",
                    errorMessage: data.errorMessage,
                    timestamp: new Date(),
                });
                yield auditLog.save();
                return auditLog;
            }
            catch (error) {
                // Don't throw - audit logging should never break the main flow
                console.error("[AuditService] Failed to log action:", error);
                return null;
            }
        });
    }
    /**
     * Log an action asynchronously (fire and forget)
     * Use this in request handlers to avoid blocking
     */
    logAsync(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Run in background, don't await
            this.log(data).catch((err) => {
                console.error("[AuditService] Async log failed:", err);
            });
        });
    }
    /**
     * Query audit logs with filters
     */
    query() {
        return __awaiter(this, arguments, void 0, function* (filter = {}, options = {}) {
            const query = {};
            // Apply filters
            if (filter.userId)
                query.userId = filter.userId;
            if (filter.resource)
                query.resource = filter.resource;
            if (filter.resourceId)
                query.resourceId = filter.resourceId;
            if (filter.business)
                query.business = filter.business;
            if (filter.status)
                query.status = filter.status;
            // Action filter (can be single or array)
            if (filter.action) {
                if (Array.isArray(filter.action)) {
                    query.action = { $in: filter.action };
                }
                else {
                    query.action = filter.action;
                }
            }
            // Date range filter
            if (filter.startDate || filter.endDate) {
                query.timestamp = {};
                if (filter.startDate)
                    query.timestamp.$gte = filter.startDate;
                if (filter.endDate)
                    query.timestamp.$lte = filter.endDate;
            }
            // Count total
            const total = yield AuditLog_1.AuditLog.countDocuments(query);
            // Build query with pagination
            const logsQuery = AuditLog_1.AuditLog.find(query);
            // Apply pagination
            if (options.skip)
                logsQuery.skip(options.skip);
            if (options.limit)
                logsQuery.limit(options.limit);
            // Apply sorting (default: most recent first)
            logsQuery.sort(options.sort || { timestamp: -1 });
            // Populate references
            logsQuery.populate("userId", "name email role");
            logsQuery.populate("business", "name");
            logsQuery.populate("department", "name");
            const logs = yield logsQuery.exec();
            return { logs, total };
        });
    }
    /**
     * Get audit logs for a specific user
     */
    getUserLogs(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            return this.query({ userId }, options);
        });
    }
    /**
     * Get audit logs for a specific resource
     */
    getResourceLogs(resource_1, resourceId_1) {
        return __awaiter(this, arguments, void 0, function* (resource, resourceId, options = {}) {
            return this.query({ resource, resourceId }, options);
        });
    }
    /**
     * Get audit logs for a specific business
     */
    getBusinessLogs(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, options = {}) {
            return this.query({ business: businessId }, options);
        });
    }
    /**
     * Get recent activity (last 24 hours)
     */
    getRecentActivity() {
        return __awaiter(this, arguments, void 0, function* (limit = 100) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const { logs } = yield this.query({ startDate: yesterday }, { limit, sort: { timestamp: -1 } });
            return logs;
        });
    }
    /**
     * Get statistics for audit logs
     */
    getStatistics() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            const query = {};
            // Apply basic filters
            if (filter.userId)
                query.userId = filter.userId;
            if (filter.business)
                query.business = filter.business;
            if (filter.startDate || filter.endDate) {
                query.timestamp = {};
                if (filter.startDate)
                    query.timestamp.$gte = filter.startDate;
                if (filter.endDate)
                    query.timestamp.$lte = filter.endDate;
            }
            const stats = yield AuditLog_1.AuditLog.aggregate([
                { $match: query },
                {
                    $facet: {
                        byAction: [
                            { $group: { _id: "$action", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 20 },
                        ],
                        byResource: [
                            { $group: { _id: "$resource", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 10 },
                        ],
                        byStatus: [
                            { $group: { _id: "$status", count: { $sum: 1 } } },
                        ],
                        byUser: [
                            { $group: { _id: "$userId", count: { $sum: 1 }, userName: { $first: "$userName" } } },
                            { $sort: { count: -1 } },
                            { $limit: 10 },
                        ],
                        overview: [
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: 1 },
                                    successful: {
                                        $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
                                    },
                                    failed: {
                                        $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] },
                                    },
                                    uniqueUsers: { $addToSet: "$userId" },
                                },
                            },
                            {
                                $project: {
                                    total: 1,
                                    successful: 1,
                                    failed: 1,
                                    uniqueUsers: { $size: "$uniqueUsers" },
                                },
                            },
                        ],
                    },
                },
            ]);
            return {
                byAction: stats[0].byAction,
                byResource: stats[0].byResource,
                byStatus: stats[0].byStatus,
                byUser: stats[0].byUser,
                overview: stats[0].overview[0] || {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    uniqueUsers: 0,
                },
            };
        });
    }
    /**
     * Get a single audit log by ID
     */
    getById(logId) {
        return __awaiter(this, void 0, void 0, function* () {
            return AuditLog_1.AuditLog.findById(logId)
                .populate("userId", "name email role")
                .populate("business", "name")
                .populate("department", "name")
                .exec();
        });
    }
    /**
     * Clean up old audit logs
     * Should be run as a scheduled job
     */
    cleanup() {
        return __awaiter(this, arguments, void 0, function* (olderThanDays = 90) {
            const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
            const result = yield AuditLog_1.AuditLog.deleteMany({
                timestamp: { $lt: cutoffDate },
            });
            console.log(`[AuditService] Cleaned up ${result.deletedCount} logs older than ${olderThanDays} days`);
            return result.deletedCount;
        });
    }
    /**
     * Export audit logs to CSV format
     */
    exportToCSV(logs) {
        let csv = "Timestamp,Action,Resource,User,Role,Business,Status,IP Address,Endpoint,Error\n";
        logs.forEach((log) => {
            var _a;
            csv += `${new Date(log.timestamp).toISOString()},`;
            csv += `${log.action},`;
            csv += `${log.resource},`;
            csv += `"${log.userName || ""}",`;
            csv += `${log.userRole || ""},`;
            csv += `"${((_a = log.business) === null || _a === void 0 ? void 0 : _a.name) || ""}",`;
            csv += `${log.status},`;
            csv += `${log.ipAddress || ""},`;
            csv += `${log.endpoint || ""},`;
            csv += `"${log.errorMessage || ""}"\n`;
        });
        return csv;
    }
    /**
     * Export audit logs to JSON format
     */
    exportToJSON(logs) {
        return JSON.stringify(logs, null, 2);
    }
    /**
     * Search audit logs by text
     */
    search(searchTerm_1) {
        return __awaiter(this, arguments, void 0, function* (searchTerm, options = {}) {
            const query = {
                $or: [
                    { userName: { $regex: searchTerm, $options: "i" } },
                    { userEmail: { $regex: searchTerm, $options: "i" } },
                    { resource: { $regex: searchTerm, $options: "i" } },
                    { endpoint: { $regex: searchTerm, $options: "i" } },
                    { errorMessage: { $regex: searchTerm, $options: "i" } },
                ],
            };
            const total = yield AuditLog_1.AuditLog.countDocuments(query);
            const logsQuery = AuditLog_1.AuditLog.find(query);
            if (options.skip)
                logsQuery.skip(options.skip);
            if (options.limit)
                logsQuery.limit(options.limit);
            logsQuery.sort(options.sort || { timestamp: -1 });
            logsQuery.populate("userId", "name email role");
            logsQuery.populate("business", "name");
            logsQuery.populate("department", "name");
            const logs = yield logsQuery.exec();
            return { logs, total };
        });
    }
    /**
     * Helper: Log authentication events
     */
    logLogin(userId_1, userName_1, userEmail_1, ipAddress_1) {
        return __awaiter(this, arguments, void 0, function* (userId, userName, userEmail, ipAddress, success = true) {
            yield this.logAsync({
                action: success ? AuditLog_1.AuditAction.LOGIN : AuditLog_1.AuditAction.LOGIN_FAILED,
                resource: "authentication",
                userId,
                userName,
                userEmail,
                ipAddress,
                status: success ? "success" : "failure",
                errorMessage: success ? undefined : "Invalid credentials",
            });
        });
    }
    /**
     * Helper: Log logout events
     */
    logLogout(userId, userName, ipAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logAsync({
                action: AuditLog_1.AuditAction.LOGOUT,
                resource: "authentication",
                userId,
                userName,
                ipAddress,
                status: "success",
            });
        });
    }
    /**
     * Helper: Log resource changes (create, update, delete)
     */
    logResourceChange(action, resource, resourceId, userId, userName, userRole, business, changes, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logAsync({
                action,
                resource,
                resourceId,
                userId,
                userName,
                userRole,
                business,
                changes,
                metadata,
                status: "success",
            });
        });
    }
}
exports.default = AuditService;
