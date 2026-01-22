import AlertService from "./AlertService";
import { AlertType, AlertSeverity } from "../models/Alert";
import { Staff } from "../../staff/models/Staff";
import { Attendance } from "../../attendance/models/Attendance";
import { Business } from "../../business/models/Business";

export default class AttendanceAlertGeneratorService {
  private alertService = new AlertService();

  /**
   * Generate alerts for staff who haven't checked in by a certain time
   * Typically run as a scheduled job daily (e.g., at 10 AM)
   */
  async generateLateCheckinAlerts(
    thresholdTime: Date = new Date(),
    businessId?: string
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Build staff query
    const staffQuery: any = {
      isActive: true,
    };

    if (businessId) {
      staffQuery.business = businessId;
    }

    // Get all active staff
    const allActiveStaff = await Staff.find(staffQuery)
      .populate("business")
      .populate("department");

    let alertsCreated = 0;

    for (const staff of allActiveStaff) {
      // Check if staff has attendance record for today
      const attendance = await Attendance.findOne({
        staff: staff._id,
        date: { $gte: today, $lte: endOfDay },
      });

      // If no attendance record and current time is past threshold
      if (!attendance && new Date() >= thresholdTime) {
        try {
          await this.alertService.createAlert({
            type: AlertType.LATE_CHECKIN,
            severity: AlertSeverity.LOW,
            staff: staff._id.toString(),
            business: (staff.business as any)._id.toString(),
            department: staff.department?._id?.toString(),
            title: "Late Check-in",
            message: `${staff.name} has not checked in yet`,
            metadata: {
              expectedTime: thresholdTime,
              currentTime: new Date(),
              staffName: staff.name,
            },
            priority: 2,
          });

          alertsCreated++;
        } catch (error) {
          console.error(
            `[AttendanceAlert] Failed to create late check-in alert for ${staff.name}:`,
            error
          );
        }
      }
    }

    console.log(
      `[AttendanceAlert] Created ${alertsCreated} late check-in alerts`
    );
    return alertsCreated;
  }

  /**
   * Generate alerts for staff who forgot to check out
   * Typically run as a scheduled job daily (e.g., at 11 PM)
   */
  async generateMissingCheckoutAlerts(businessId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query
    const query: any = {
      date: { $gte: today, $lte: endOfDay },
      checkInTime: { $exists: true },
      checkOutTime: { $exists: false },
    };

    // Find attendance records with check-in but no check-out
    const attendanceRecords = await Attendance.find(query).populate({
      path: "staff",
      populate: [{ path: "business" }, { path: "department" }],
    });

    let alertsCreated = 0;

    for (const record of attendanceRecords) {
      const staff = record.staff as any;

      if (!staff) continue;

      // Apply business filter if provided
      if (businessId && staff.business._id.toString() !== businessId) {
        continue;
      }

      try {
        await this.alertService.createAlert({
          type: AlertType.MISSING_CHECKOUT,
          severity: AlertSeverity.MEDIUM,
          staff: staff._id.toString(),
          business: staff.business._id.toString(),
          department: staff.department?._id?.toString(),
          title: "Missing Checkout",
          message: `${staff.name} forgot to check out`,
          metadata: {
            checkInTime: record.checkInTime,
            attendanceId: record._id.toString(),
            staffName: staff.name,
            date: record.date,
          },
          priority: 2,
        });

        alertsCreated++;
      } catch (error) {
        console.error(
          `[AttendanceAlert] Failed to create missing checkout alert for ${staff.name}:`,
          error
        );
      }
    }

    console.log(
      `[AttendanceAlert] Created ${alertsCreated} missing checkout alerts`
    );
    return alertsCreated;
  }

  /**
   * Generate alert for suspicious attendance pattern (attendance anomaly)
   * Examples: Multiple check-ins same day, very short work duration, etc.
   */
  async generateAttendanceAnomalyAlert(attendanceId: string): Promise<void> {
    const attendance = await Attendance.findById(attendanceId).populate({
      path: "staff",
      populate: [{ path: "business" }, { path: "department" }],
    });

    if (!attendance || !attendance.staff) {
      return;
    }

    const staff = attendance.staff as any;
    const anomalies: string[] = [];

    // Check for very short work duration (< 1 hour)
    if (attendance.checkInTime && attendance.checkOutTime) {
      const duration =
        attendance.checkOutTime.getTime() - attendance.checkInTime.getTime();
      const hours = duration / (1000 * 60 * 60);

      if (hours < 1) {
        anomalies.push(`Very short work duration (${Math.round(hours * 60)} minutes)`);
      }

      // Check for unusually long work duration (> 16 hours)
      if (hours > 16) {
        anomalies.push(`Unusually long work duration (${Math.round(hours)} hours)`);
      }
    }

    // Check for duplicate attendance records on same day
    const today = attendance.date;
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const duplicateCount = await Attendance.countDocuments({
      staff: staff._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (duplicateCount > 1) {
      anomalies.push(`Multiple attendance records on same day (${duplicateCount} records)`);
    }

    // If anomalies detected, create alert
    if (anomalies.length > 0) {
      await this.alertService.createAlert({
        type: AlertType.ATTENDANCE_ANOMALY,
        severity: AlertSeverity.MEDIUM,
        staff: staff._id.toString(),
        business: staff.business._id.toString(),
        department: staff.department?._id?.toString(),
        title: "Attendance Anomaly Detected",
        message: `Suspicious attendance pattern for ${staff.name}: ${anomalies.join(", ")}`,
        metadata: {
          anomalies,
          attendanceId: attendanceId,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          date: attendance.date,
        },
        priority: 3,
      });

      console.log(
        `[AttendanceAlert] Attendance anomaly alert created for ${staff.name}`
      );
    }
  }

  /**
   * Check for weekend/holiday attendance (optional anomaly)
   */
  async checkWeekendAttendance(attendanceId: string): Promise<void> {
    const attendance = await Attendance.findById(attendanceId).populate({
      path: "staff",
      populate: [{ path: "business" }, { path: "department" }],
    });

    if (!attendance || !attendance.staff) {
      return;
    }

    const staff = attendance.staff as any;
    const date = attendance.date;
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if attendance is on weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      await this.alertService.createAlert({
        type: AlertType.ATTENDANCE_ANOMALY,
        severity: AlertSeverity.LOW,
        staff: staff._id.toString(),
        business: staff.business._id.toString(),
        department: staff.department?._id?.toString(),
        title: "Weekend Attendance",
        message: `${staff.name} checked in on ${dayOfWeek === 0 ? "Sunday" : "Saturday"}`,
        metadata: {
          attendanceId: attendanceId,
          date: date,
          dayOfWeek: dayOfWeek === 0 ? "Sunday" : "Saturday",
        },
        priority: 1,
      });

      console.log(
        `[AttendanceAlert] Weekend attendance alert created for ${staff.name}`
      );
    }
  }

  /**
   * Batch generate all attendance alerts for today
   * Can be run as a scheduled job
   */
  async generateDailyAttendanceAlerts(businessId?: string): Promise<{
    lateCheckin: number;
    missingCheckout: number;
  }> {
    // Generate late check-in alerts (threshold: 9:30 AM)
    const thresholdTime = new Date();
    thresholdTime.setHours(9, 30, 0, 0);

    const lateCheckin = await this.generateLateCheckinAlerts(
      thresholdTime,
      businessId
    );

    // Generate missing checkout alerts (should be run in evening/night)
    const missingCheckout = await this.generateMissingCheckoutAlerts(
      businessId
    );

    return {
      lateCheckin,
      missingCheckout,
    };
  }
}
