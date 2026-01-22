import {
  Alert,
  AlertType,
  AlertSeverity,
  AlertStatus,
  IAlert,
} from "../models/Alert";
import mongoose from "mongoose";
import { Staff } from "../../staff/models/Staff";

export interface CreateAlertDTO {
  type: AlertType;
  severity: AlertSeverity;
  staff: string;
  business: string;
  department?: string;
  title: string;
  message: string;
  metadata?: any;
  priority?: number;
  expiresAt?: Date;
}

export interface AcknowledgeAlertDTO {
  userId: string;
  userName: string;
}

export interface ResolveAlertDTO {
  userId: string;
  resolutionNotes?: string;
}

export interface GetAlertsFilter {
  business?: string;
  staff?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  acknowledged?: boolean;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface GetAlertsOptions {
  skip?: number;
  limit?: number;
  sort?: any;
  populate?: boolean;
}

export default class AlertService {
  /**
   * Create a new alert
   */
  async createAlert(data: CreateAlertDTO): Promise<IAlert> {
    // Check for duplicate alerts (same type, staff, within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingAlert = await Alert.findOne({
      type: data.type,
      staff: data.staff,
      status: AlertStatus.ACTIVE,
      createdAt: { $gte: oneHourAgo },
    });

    if (existingAlert) {
      // Don't create duplicate - just update priority if higher
      if (data.priority && data.priority > existingAlert.priority) {
        existingAlert.priority = data.priority;
        await existingAlert.save();
      }
      return existingAlert;
    }

    const alert = new Alert({
      ...data,
      status: AlertStatus.ACTIVE,
      acknowledged: false,
      resolved: false,
      priority: data.priority || 3,
    });

    await alert.save();

    // Populate staff and business names
    await alert.populate([
      { path: "staff", select: "name email" },
      { path: "business", select: "name" },
    ]);

    return alert;
  }

  /**
   * Get alerts with filters and pagination
   */
  async getAlerts(
    filter: GetAlertsFilter,
    options: GetAlertsOptions = {}
  ): Promise<{ alerts: IAlert[]; total: number }> {
    const query: any = {};

    // Apply filters
    if (filter.business) query.business = filter.business;
    if (filter.staff) query.staff = filter.staff;
    if (filter.type) query.type = filter.type;
    if (filter.severity) query.severity = filter.severity;
    if (filter.status) query.status = filter.status;
    if (filter.acknowledged !== undefined)
      query.acknowledged = filter.acknowledged;
    if (filter.resolved !== undefined) query.resolved = filter.resolved;

    // Date range filter
    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) query.createdAt.$gte = filter.startDate;
      if (filter.endDate) query.createdAt.$lte = filter.endDate;
    }

    const total = await Alert.countDocuments(query);

    const alertsQuery = Alert.find(query);

    // Apply pagination
    if (options.skip) alertsQuery.skip(options.skip);
    if (options.limit) alertsQuery.limit(options.limit);

    // Apply sorting (default: priority desc, createdAt desc)
    alertsQuery.sort(
      options.sort || { priority: -1, createdAt: -1 }
    );

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

    const alerts = await alertsQuery.exec();

    return { alerts, total };
  }

  /**
   * Get active alerts (not acknowledged or resolved)
   */
  async getActiveAlerts(
    businessId?: string
  ): Promise<IAlert[]> {
    const query: any = { status: AlertStatus.ACTIVE };
    if (businessId) query.business = businessId;

    return Alert.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .populate([
        { path: "staff", select: "name email" },
        { path: "business", select: "name" },
      ])
      .exec();
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId: string): Promise<IAlert | null> {
    return Alert.findById(alertId)
      .populate([
        { path: "staff", select: "name email phone" },
        { path: "business", select: "name" },
        { path: "department", select: "name" },
        { path: "acknowledgedBy", select: "name email" },
        { path: "resolvedBy", select: "name email" },
      ])
      .exec();
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    data: AcknowledgeAlertDTO
  ): Promise<IAlert | null> {
    const alert = await Alert.findById(alertId);

    if (!alert) {
      throw new Error("Alert not found");
    }

    if (alert.acknowledged) {
      throw new Error("Alert already acknowledged");
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = new mongoose.Types.ObjectId(data.userId);
    alert.acknowledgedByName = data.userName;
    alert.status = AlertStatus.ACKNOWLEDGED;

    await alert.save();

    return this.getAlertById(alertId);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    data: ResolveAlertDTO
  ): Promise<IAlert | null> {
    const alert = await Alert.findById(alertId);

    if (!alert) {
      throw new Error("Alert not found");
    }

    if (alert.resolved) {
      throw new Error("Alert already resolved");
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = new mongoose.Types.ObjectId(data.userId);
    alert.resolutionNotes = data.resolutionNotes;
    alert.status = AlertStatus.RESOLVED;

    await alert.save();

    return this.getAlertById(alertId);
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId: string): Promise<IAlert | null> {
    const alert = await Alert.findById(alertId);

    if (!alert) {
      throw new Error("Alert not found");
    }

    alert.status = AlertStatus.DISMISSED;
    await alert.save();

    return alert;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(businessId?: string): Promise<any> {
    const match: any = {};
    if (businessId) match.business = new mongoose.Types.ObjectId(businessId);

    const stats = await Alert.aggregate([
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
  }

  /**
   * Auto-expire old alerts
   * Should be run as a cron job
   */
  async expireOldAlerts(hoursOld: number = 24): Promise<number> {
    const expiryDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    const result = await Alert.updateMany(
      {
        status: AlertStatus.ACTIVE,
        acknowledged: false,
        createdAt: { $lt: expiryDate },
      },
      {
        $set: { status: AlertStatus.DISMISSED },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Delete old resolved/dismissed alerts
   * Should be run as a cron job for cleanup
   */
  async cleanupOldAlerts(daysOld: number = 30): Promise<number> {
    const cleanupDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await Alert.deleteMany({
      status: { $in: [AlertStatus.RESOLVED, AlertStatus.DISMISSED] },
      createdAt: { $lt: cleanupDate },
    });

    return result.deletedCount;
  }

  /**
   * Get alert count for a staff member
   */
  async getStaffAlertCount(
    staffId: string,
    activeOnly: boolean = false
  ): Promise<number> {
    const query: any = { staff: staffId };
    if (activeOnly) query.status = AlertStatus.ACTIVE;

    return Alert.countDocuments(query);
  }
}
