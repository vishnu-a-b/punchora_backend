/**
 * Audit Service
 *
 * Handles all audit logging operations.
 * Provides methods to log actions, query logs, and generate statistics.
 */

import { AuditLog, AuditAction, IAuditLog } from "../models/AuditLog";
import mongoose from "mongoose";

export interface CreateAuditLogDTO {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  business?: string;
  department?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  status?: "success" | "failure";
  errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: string;
  resource?: string;
  resourceId?: string;
  action?: AuditAction | AuditAction[];
  business?: string;
  status?: "success" | "failure";
  startDate?: Date;
  endDate?: Date;
}

export interface QueryOptions {
  skip?: number;
  limit?: number;
  sort?: any;
}

export default class AuditService {
  /**
   * Log an action to the audit trail
   * This is the primary method called throughout the application
   */
  async log(data: CreateAuditLogDTO): Promise<IAuditLog | null> {
    try {
      const auditLog = new AuditLog({
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

      await auditLog.save();
      return auditLog;
    } catch (error) {
      // Don't throw - audit logging should never break the main flow
      console.error("[AuditService] Failed to log action:", error);
      return null;
    }
  }

  /**
   * Log an action asynchronously (fire and forget)
   * Use this in request handlers to avoid blocking
   */
  async logAsync(data: CreateAuditLogDTO): Promise<void> {
    // Run in background, don't await
    this.log(data).catch((err) => {
      console.error("[AuditService] Async log failed:", err);
    });
  }

  /**
   * Query audit logs with filters
   */
  async query(
    filter: AuditLogFilter = {},
    options: QueryOptions = {}
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    const query: any = {};

    // Apply filters
    if (filter.userId) query.userId = filter.userId;
    if (filter.resource) query.resource = filter.resource;
    if (filter.resourceId) query.resourceId = filter.resourceId;
    if (filter.business) query.business = filter.business;
    if (filter.status) query.status = filter.status;

    // Action filter (can be single or array)
    if (filter.action) {
      if (Array.isArray(filter.action)) {
        query.action = { $in: filter.action };
      } else {
        query.action = filter.action;
      }
    }

    // Date range filter
    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) query.timestamp.$gte = filter.startDate;
      if (filter.endDate) query.timestamp.$lte = filter.endDate;
    }

    // Count total
    const total = await AuditLog.countDocuments(query);

    // Build query with pagination
    const logsQuery = AuditLog.find(query);

    // Apply pagination
    if (options.skip) logsQuery.skip(options.skip);
    if (options.limit) logsQuery.limit(options.limit);

    // Apply sorting (default: most recent first)
    logsQuery.sort(options.sort || { timestamp: -1 });

    // Populate references
    logsQuery.populate("userId", "name email role");
    logsQuery.populate("business", "name");
    logsQuery.populate("department", "name");

    const logs = await logsQuery.exec();

    return { logs, total };
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserLogs(
    userId: string,
    options: QueryOptions = {}
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return this.query({ userId }, options);
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceLogs(
    resource: string,
    resourceId: string,
    options: QueryOptions = {}
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return this.query({ resource, resourceId }, options);
  }

  /**
   * Get audit logs for a specific business
   */
  async getBusinessLogs(
    businessId: string,
    options: QueryOptions = {}
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    return this.query({ business: businessId }, options);
  }

  /**
   * Get recent activity (last 24 hours)
   */
  async getRecentActivity(
    limit: number = 100
  ): Promise<IAuditLog[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { logs } = await this.query(
      { startDate: yesterday },
      { limit, sort: { timestamp: -1 } }
    );

    return logs;
  }

  /**
   * Get statistics for audit logs
   */
  async getStatistics(filter: AuditLogFilter = {}): Promise<any> {
    const query: any = {};

    // Apply basic filters
    if (filter.userId) query.userId = filter.userId;
    if (filter.business) query.business = filter.business;
    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) query.timestamp.$gte = filter.startDate;
      if (filter.endDate) query.timestamp.$lte = filter.endDate;
    }

    const stats = await AuditLog.aggregate([
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
  }

  /**
   * Get a single audit log by ID
   */
  async getById(logId: string): Promise<IAuditLog | null> {
    return AuditLog.findById(logId)
      .populate("userId", "name email role")
      .populate("business", "name")
      .populate("department", "name")
      .exec();
  }

  /**
   * Clean up old audit logs
   * Should be run as a scheduled job
   */
  async cleanup(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(
      `[AuditService] Cleaned up ${result.deletedCount} logs older than ${olderThanDays} days`
    );

    return result.deletedCount;
  }

  /**
   * Export audit logs to CSV format
   */
  exportToCSV(logs: IAuditLog[]): string {
    let csv = "Timestamp,Action,Resource,User,Role,Business,Status,IP Address,Endpoint,Error\n";

    logs.forEach((log) => {
      csv += `${new Date(log.timestamp).toISOString()},`;
      csv += `${log.action},`;
      csv += `${log.resource},`;
      csv += `"${log.userName || ""}",`;
      csv += `${log.userRole || ""},`;
      csv += `"${(log.business as any)?.name || ""}",`;
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
  exportToJSON(logs: IAuditLog[]): string {
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Search audit logs by text
   */
  async search(
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    const query = {
      $or: [
        { userName: { $regex: searchTerm, $options: "i" } },
        { userEmail: { $regex: searchTerm, $options: "i" } },
        { resource: { $regex: searchTerm, $options: "i" } },
        { endpoint: { $regex: searchTerm, $options: "i" } },
        { errorMessage: { $regex: searchTerm, $options: "i" } },
      ],
    };

    const total = await AuditLog.countDocuments(query);
    const logsQuery = AuditLog.find(query);

    if (options.skip) logsQuery.skip(options.skip);
    if (options.limit) logsQuery.limit(options.limit);
    logsQuery.sort(options.sort || { timestamp: -1 });

    logsQuery.populate("userId", "name email role");
    logsQuery.populate("business", "name");
    logsQuery.populate("department", "name");

    const logs = await logsQuery.exec();

    return { logs, total };
  }

  /**
   * Helper: Log authentication events
   */
  async logLogin(userId: string, userName: string, userEmail: string, ipAddress?: string, success: boolean = true): Promise<void> {
    await this.logAsync({
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      resource: "authentication",
      userId,
      userName,
      userEmail,
      ipAddress,
      status: success ? "success" : "failure",
      errorMessage: success ? undefined : "Invalid credentials",
    });
  }

  /**
   * Helper: Log logout events
   */
  async logLogout(userId: string, userName: string, ipAddress?: string): Promise<void> {
    await this.logAsync({
      action: AuditAction.LOGOUT,
      resource: "authentication",
      userId,
      userName,
      ipAddress,
      status: "success",
    });
  }

  /**
   * Helper: Log resource changes (create, update, delete)
   */
  async logResourceChange(
    action: AuditAction,
    resource: string,
    resourceId: string,
    userId: string,
    userName: string,
    userRole: string,
    business?: string,
    changes?: { before?: any; after?: any },
    metadata?: any
  ): Promise<void> {
    await this.logAsync({
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
  }
}
