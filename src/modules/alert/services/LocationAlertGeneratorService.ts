import AlertService, { CreateAlertDTO } from "./AlertService";
import { AlertType, AlertSeverity } from "../models/Alert";
import { Staff } from "../../staff/models/Staff";
import { Attendance } from "../../attendance/models/Attendance";

export default class LocationAlertGeneratorService {
  private alertService = new AlertService();

  /**
   * Generate alert when staff disables location tracking
   */
  async generateLocationDisabledAlert(staffId: string): Promise<void> {
    const staff = await Staff.findById(staffId)
      .populate("business")
      .populate("department")
      .populate("user");

    if (!staff) {
      console.error(`[LocationAlert] Staff not found: ${staffId}`);
      return;
    }

    // Note: Location tracking enabled/disabled is tracked elsewhere
    // This is a placeholder for when that field is added to User or Staff model
    const user = staff.user as any;

    await this.alertService.createAlert({
      type: AlertType.LOCATION_DISABLED,
      severity: AlertSeverity.MEDIUM,
      staff: staffId,
      business: (staff.business as any)._id.toString(),
      department: staff.department?._id?.toString(),
      title: "Location Tracking Disabled",
      message: `${staff.name} has disabled location tracking`,
      metadata: {
        staffName: staff.name,
        userEmail: user?.email || "N/A",
        timestamp: new Date(),
      },
      priority: 3,
    });

    console.log(
      `[LocationAlert] Location disabled alert created for ${staff.name}`
    );
  }

  /**
   * Generate alert when mocked/fake GPS is detected
   */
  async generateMockedGPSAlert(attendanceId: string): Promise<void> {
    const attendance = await Attendance.findById(attendanceId).populate({
      path: "staff",
      populate: [{ path: "business" }, { path: "department" }],
    });

    if (!attendance || !attendance.staff) {
      console.error(`[LocationAlert] Attendance not found: ${attendanceId}`);
      return;
    }

    const staff = attendance.staff as any;

    // Check if check-in location is mocked
    if (attendance.checkInLocation?.mocked === true) {
      await this.alertService.createAlert({
        type: AlertType.MOCKED_GPS,
        severity: AlertSeverity.HIGH,
        staff: staff._id.toString(),
        business: staff.business._id.toString(),
        department: staff.department?._id?.toString(),
        title: "GPS Spoofing Detected",
        message: `Possible GPS spoofing detected for ${staff.name} during check-in`,
        metadata: {
          location: {
            latitude: attendance.checkInLocation.latitude,
            longitude: attendance.checkInLocation.longitude,
          },
          accuracy: attendance.checkInLocation.accuracy,
          timestamp: attendance.checkInTime,
          attendanceId: attendanceId,
        },
        priority: 4,
      });

      console.log(
        `[LocationAlert] Mocked GPS alert created for ${staff.name}`
      );
    }

    // Check if check-out location is mocked
    if (attendance.checkOutLocation?.mocked === true) {
      await this.alertService.createAlert({
        type: AlertType.MOCKED_GPS,
        severity: AlertSeverity.HIGH,
        staff: staff._id.toString(),
        business: staff.business._id.toString(),
        department: staff.department?._id?.toString(),
        title: "GPS Spoofing Detected",
        message: `Possible GPS spoofing detected for ${staff.name} during check-out`,
        metadata: {
          location: {
            latitude: attendance.checkOutLocation.latitude,
            longitude: attendance.checkOutLocation.longitude,
          },
          accuracy: attendance.checkOutLocation.accuracy,
          timestamp: attendance.checkOutTime,
          attendanceId: attendanceId,
        },
        priority: 4,
      });

      console.log(
        `[LocationAlert] Mocked GPS alert created for ${staff.name} (checkout)`
      );
    }
  }

  /**
   * Generate alert when check-in is outside allowed geo-fence
   */
  async generateGeoViolationAlert(
    attendanceId: string,
    allowedLocations: Array<{ latitude: number; longitude: number }>,
    maxDistance: number = 500 // meters
  ): Promise<void> {
    const attendance = await Attendance.findById(attendanceId).populate({
      path: "staff",
      populate: [{ path: "business" }, { path: "department" }],
    });

    if (!attendance || !attendance.staff || !attendance.checkInLocation) {
      return;
    }

    const staff = attendance.staff as any;
    const checkInLoc = attendance.checkInLocation;

    // Check if check-in location is within allowed radius
    const isWithinGeoFence = allowedLocations.some((allowedLoc) => {
      const distance = this.calculateDistance(
        checkInLoc.latitude,
        checkInLoc.longitude,
        allowedLoc.latitude,
        allowedLoc.longitude
      );
      return distance <= maxDistance;
    });

    if (!isWithinGeoFence && allowedLocations.length > 0) {
      // Calculate distance to nearest allowed location
      const nearestLocation = allowedLocations[0];
      const distance = this.calculateDistance(
        checkInLoc.latitude,
        checkInLoc.longitude,
        nearestLocation.latitude,
        nearestLocation.longitude
      );

      await this.alertService.createAlert({
        type: AlertType.GEO_VIOLATION,
        severity: AlertSeverity.HIGH,
        staff: staff._id.toString(),
        business: staff.business._id.toString(),
        department: staff.department?._id?.toString(),
        title: "Geo-fence Violation",
        message: `${staff.name} checked in from unauthorized location (${Math.round(distance)}m away)`,
        metadata: {
          location: {
            latitude: checkInLoc.latitude,
            longitude: checkInLoc.longitude,
          },
          expectedLocation: nearestLocation,
          distance: Math.round(distance),
          timestamp: attendance.checkInTime,
          attendanceId: attendanceId,
        },
        priority: 4,
      });

      console.log(
        `[LocationAlert] Geo-violation alert created for ${staff.name} (${Math.round(distance)}m away)`
      );
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Batch check for location disabled across all active staff
   * (Can be run as a scheduled job)
   */
  async checkAllStaffLocationStatus(businessId?: string): Promise<number> {
    const query: any = {
      isActive: true,
    };

    if (businessId) {
      query.business = businessId;
    }

    // Note: This would need to check User.locationEnabled or similar field
    // For now, this is a placeholder implementation
    const staffList = await Staff.find(query).select("_id name");

    let alertsCreated = 0;

    // This would need actual logic to check location status from User model
    // For now, returning 0 as this requires the location tracking field to exist
    console.log(
      `[LocationAlert] Location status check completed (placeholder)`
    );
    return alertsCreated;
  }
}
