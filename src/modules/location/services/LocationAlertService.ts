import { LocationAlert } from "../models/LocationAlert";
import { FailedLocationAttempt } from "../models/FailedLocationAttempt";
import { LocationData } from "../models/LocationData";

export default class LocationAlertService {
  // Create a new alert
  create = async (body: any) => {
    return await LocationAlert.create(body);
  };

  // Get all alerts with filtering
  list = async ({
    limit = 50,
    skip = 0,
    acknowledged,
    alertType,
    severity,
    businessId,
  }: {
    limit?: number;
    skip?: number;
    acknowledged?: boolean;
    alertType?: string;
    severity?: string;
    businessId?: string;
  }) => {
    const query: any = {};

    if (acknowledged !== undefined) {
      query.acknowledged = acknowledged;
    }

    if (alertType) {
      query.alertType = alertType;
    }

    if (severity) {
      query.severity = severity;
    }

    const pipeline: any[] = [
      {
        $match: query,
      },
      {
        $lookup: {
          from: "staffs",
          localField: "staff",
          foreignField: "_id",
          as: "staffInfo",
        },
      },
      {
        $unwind: {
          path: "$staffInfo",
          preserveNullAndEmptyArrays: false,
        },
      },
    ];

    if (businessId) {
      pipeline.push({
        $match: {
          "staffInfo.business": businessId,
        },
      });
    }

    pipeline.push(
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          alertType: 1,
          severity: 1,
          message: 1,
          details: 1,
          acknowledged: 1,
          acknowledgedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          "staffInfo._id": 1,
          "staffInfo.name": 1,
          "staffInfo.email": 1,
        },
      }
    );

    const alerts = await LocationAlert.aggregate(pipeline);
    const total = await LocationAlert.countDocuments(query);

    return {
      total,
      limit,
      skip,
      items: alerts,
    };
  };

  // Acknowledge an alert
  acknowledge = async (alertId: string, userId: string) => {
    return await LocationAlert.findByIdAndUpdate(
      alertId,
      {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );
  };

  // Resolve an alert
  resolve = async (alertId: string) => {
    return await LocationAlert.findByIdAndUpdate(
      alertId,
      {
        resolvedAt: new Date(),
      },
      { new: true }
    );
  };

  // Auto-generate alerts based on location data
  generateAlertsFromFailedAttempts = async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Find recent failed attempts
    const failedAttempts = await FailedLocationAttempt.find({
      attemptTime: { $gte: tenMinutesAgo },
      reason: { $in: ["location_off", "permission_denied"] },
    }).populate("staff");

    const alerts = [];

    for (const attempt of failedAttempts) {
      // Check if alert already exists for this staff in the last 30 minutes
      const existingAlert = await LocationAlert.findOne({
        staff: attempt.staff,
        alertType:
          attempt.reason === "location_off"
            ? "location_disabled"
            : "permission_denied",
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
      });

      if (!existingAlert) {
        const alert = await this.create({
          staff: attempt.staff,
          alertType:
            attempt.reason === "location_off"
              ? "location_disabled"
              : "permission_denied",
          severity: "high",
          message:
            attempt.reason === "location_off"
              ? "Staff has disabled location services"
              : "Staff has denied location permissions",
          details: {
            attemptTime: attempt.attemptTime,
            errorMessage: attempt.errorMessage,
          },
        });
        alerts.push(alert);
      }
    }

    return alerts;
  };

  // Auto-generate alerts for mocked GPS
  generateAlertsFromMockedGPS = async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find recent mocked locations
    const mockedLocations = await LocationData.find({
      date: { $gte: oneHourAgo },
      mocked: true,
    }).populate("staff");

    // Group by staff
    const staffMockCounts: any = {};
    for (const loc of mockedLocations) {
      const staffId = (loc.staff as any)._id.toString();
      if (!staffMockCounts[staffId]) {
        staffMockCounts[staffId] = {
          staff: loc.staff,
          count: 0,
        };
      }
      staffMockCounts[staffId].count++;
    }

    const alerts = [];

    // Create alerts for staff with multiple mock detections
    for (const staffId in staffMockCounts) {
      const { staff, count } = staffMockCounts[staffId];

      if (count >= 3) {
        // Only alert if 3+ mocked locations
        // Check if alert already exists
        const existingAlert = await LocationAlert.findOne({
          staff: staffId,
          alertType: "mocked_gps",
          createdAt: { $gte: oneHourAgo },
        });

        if (!existingAlert) {
          const alert = await this.create({
            staff: staffId,
            alertType: "mocked_gps",
            severity: "critical",
            message: `Fake GPS detected ${count} times in the last hour`,
            details: {
              detectionCount: count,
              timeWindow: "1 hour",
            },
          });
          alerts.push(alert);
        }
      }
    }

    return alerts;
  };

  // Delete old resolved alerts (cleanup)
  cleanupOldAlerts = async (daysOld: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await LocationAlert.deleteMany({
      resolvedAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
  };
}
