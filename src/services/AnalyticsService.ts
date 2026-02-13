/**
 * Analytics Service
 * Provides real-time dashboard metrics and analytics
 * Phase 6: Admin Dashboard Enhancements
 */

import { Staff } from '../modules/staff/models/Staff';
import { Attendance } from '../modules/attendance/models/Attendance';
import { Alert, AlertStatus } from '../modules/alert/models/Alert';
import { Activity, ActivityStatus } from '../modules/activity/models/Activity';
import { SyncBatch } from '../modules/offlineFaceRecognition/models/SyncBatch';
import cacheService from './CacheService';

export interface DashboardMetrics {
  attendance: {
    presentToday: number;
    lateCheckins: number;
    missingCheckouts: number;
    flaggedRecords: number;
    averageCheckInTime?: string;
    onTimeRate: number;
  };
  alerts: {
    activeAlerts: number;
    criticalAlerts: number;
    resolvedToday: number;
    acknowledgedToday: number;
    topAlertTypes: { type: string; count: number }[];
  };
  activities: {
    ongoingActivities: number;
    completedToday: number;
    averageDuration: number;
    topActivityTypes: { type: string; count: number }[];
  };
  staff: {
    totalActive: number;
    onDuty: number;
    onLeave: number;
    withAlerts: number;
  };
  sync: {
    pendingBatches: number;
    lastSyncTime?: Date;
    failedSyncsToday: number;
    successRate: number;
  };
}

export default class AnalyticsService {
  private cacheService = cacheService;
  private readonly CACHE_TTL = 60; // 1 minute cache for real-time metrics

  constructor() {
    // cacheService is already initialized as singleton
  }

  /**
   * Get dashboard metrics for a business
   * Parallel aggregation for performance
   */
  async getDashboardMetrics(
    businessId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<DashboardMetrics> {
    const cacheKey = `analytics:dashboard:${businessId}:${Date.now() - (Date.now() % 60000)}`;

    // Try cache first (1 minute TTL)
    const cached = await this.cacheService.get<DashboardMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all aggregations in parallel for performance
    const [
      attendanceMetrics,
      alertMetrics,
      activityMetrics,
      staffMetrics,
      syncMetrics
    ] = await Promise.all([
      this.getAttendanceMetrics(businessId, today, tomorrow),
      this.getAlertMetrics(businessId, today, tomorrow),
      this.getActivityMetrics(businessId, today, tomorrow),
      this.getStaffMetrics(businessId),
      this.getSyncMetrics(today, tomorrow)
    ]);

    const metrics: DashboardMetrics = {
      attendance: attendanceMetrics,
      alerts: alertMetrics,
      activities: activityMetrics,
      staff: staffMetrics,
      sync: syncMetrics
    };

    // Cache for 1 minute
    await this.cacheService.set(cacheKey, metrics, this.CACHE_TTL);

    return metrics;
  }

  /**
   * Get attendance metrics
   */
  private async getAttendanceMetrics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetrics['attendance']> {
    const staffList = await Staff.find({ business: businessId, isActive: true });
    const staffIds = staffList.map(s => s._id);

    const [
      presentToday,
      lateCheckins,
      missingCheckouts,
      flaggedRecords,
      onTimeRecords
    ] = await Promise.all([
      Attendance.countDocuments({
        staff: { $in: staffIds },
        date: { $gte: startDate, $lt: endDate },
        checkInTime: { $exists: true }
      }),
      Attendance.countDocuments({
        staff: { $in: staffIds },
        date: { $gte: startDate, $lt: endDate },
        flagged: true,
        flagReason: { $regex: /late/i }
      }),
      Attendance.countDocuments({
        staff: { $in: staffIds },
        date: { $gte: startDate, $lt: endDate },
        checkInTime: { $exists: true },
        checkOutTime: { $exists: false }
      }),
      Attendance.countDocuments({
        staff: { $in: staffIds },
        date: { $gte: startDate, $lt: endDate },
        flagged: true
      }),
      Attendance.countDocuments({
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
  }

  /**
   * Get alert metrics
   */
  private async getAlertMetrics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetrics['alerts']> {
    const [
      activeAlerts,
      criticalAlerts,
      resolvedToday,
      acknowledgedToday,
      topAlertTypes
    ] = await Promise.all([
      Alert.countDocuments({
        business: businessId,
        status: AlertStatus.ACTIVE
      }),
      Alert.countDocuments({
        business: businessId,
        status: AlertStatus.ACTIVE,
        severity: 'critical'
      }),
      Alert.countDocuments({
        business: businessId,
        status: AlertStatus.RESOLVED,
        resolvedAt: { $gte: startDate, $lt: endDate }
      }),
      Alert.countDocuments({
        business: businessId,
        acknowledgedAt: { $gte: startDate, $lt: endDate }
      }),
      Alert.aggregate([
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
  }

  /**
   * Get activity metrics
   */
  private async getActivityMetrics(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetrics['activities']> {
    const [
      ongoingActivities,
      completedToday,
      avgDuration,
      topActivityTypes
    ] = await Promise.all([
      Activity.countDocuments({
        business: businessId,
        status: ActivityStatus.STARTED
      }),
      Activity.countDocuments({
        business: businessId,
        status: ActivityStatus.ENDED,
        endTime: { $gte: startDate, $lt: endDate }
      }),
      Activity.aggregate([
        {
          $match: {
            business: businessId,
            status: ActivityStatus.ENDED,
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
      Activity.aggregate([
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

    const averageDuration = avgDuration[0]?.avgDuration || 0;

    return {
      ongoingActivities,
      completedToday,
      averageDuration: Math.round(averageDuration * 10) / 10,
      topActivityTypes: topActivityTypes.map(t => ({ type: t._id, count: t.count }))
    };
  }

  /**
   * Get staff metrics
   */
  private async getStaffMetrics(businessId: string): Promise<DashboardMetrics['staff']> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalActive,
      onDuty,
      withAlerts
    ] = await Promise.all([
      Staff.countDocuments({
        business: businessId,
        isActive: true
      }),
      Attendance.aggregate([
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
      Alert.aggregate([
        {
          $match: {
            business: businessId,
            status: AlertStatus.ACTIVE
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
      onDuty: onDuty[0]?.total || 0,
      onLeave: 0, // TODO: Implement leave tracking
      withAlerts: withAlerts[0]?.total || 0
    };
  }

  /**
   * Get sync metrics
   */
  private async getSyncMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetrics['sync']> {
    const [
      pendingBatches,
      lastSync,
      failedSyncsToday,
      successfulSyncsToday
    ] = await Promise.all([
      SyncBatch.countDocuments({
        status: 'processing'
      }),
      SyncBatch.findOne().sort({ completedAt: -1 }).select('completedAt'),
      SyncBatch.countDocuments({
        status: 'failed',
        startedAt: { $gte: startDate, $lt: endDate }
      }),
      SyncBatch.countDocuments({
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
      lastSyncTime: lastSync?.completedAt ?? undefined,
      failedSyncsToday,
      successRate: Math.round(successRate * 10) / 10
    };
  }

  /**
   * Get trend data for charts
   */
  async getTrendData(
    businessId: string,
    metric: 'attendance' | 'alerts' | 'activities',
    days: number = 7
  ): Promise<{ date: string; value: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let aggregation;

    switch (metric) {
      case 'attendance':
        aggregation = await this.getAttendanceTrend(businessId, startDate, endDate, days);
        break;
      case 'alerts':
        aggregation = await this.getAlertTrend(businessId, startDate, endDate, days);
        break;
      case 'activities':
        aggregation = await this.getActivityTrend(businessId, startDate, endDate, days);
        break;
    }

    return aggregation;
  }

  private async getAttendanceTrend(
    businessId: string,
    startDate: Date,
    endDate: Date,
    days: number
  ) {
    const staffList = await Staff.find({ business: businessId });
    const staffIds = staffList.map(s => s._id);

    const trend = await Attendance.aggregate([
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
  }

  private async getAlertTrend(
    businessId: string,
    startDate: Date,
    endDate: Date,
    days: number
  ) {
    const trend = await Alert.aggregate([
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
  }

  private async getActivityTrend(
    businessId: string,
    startDate: Date,
    endDate: Date,
    days: number
  ) {
    const trend = await Activity.aggregate([
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
  }
}
