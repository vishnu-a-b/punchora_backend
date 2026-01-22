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
const AlertService_1 = __importDefault(require("./AlertService"));
const Alert_1 = require("../models/Alert");
const Staff_1 = require("../../staff/models/Staff");
const Attendance_1 = require("../../attendance/models/Attendance");
class LocationAlertGeneratorService {
    constructor() {
        this.alertService = new AlertService_1.default();
    }
    /**
     * Generate alert when staff disables location tracking
     */
    generateLocationDisabledAlert(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const staff = yield Staff_1.Staff.findById(staffId)
                .populate("business")
                .populate("department")
                .populate("user");
            if (!staff) {
                console.error(`[LocationAlert] Staff not found: ${staffId}`);
                return;
            }
            // Note: Location tracking enabled/disabled is tracked elsewhere
            // This is a placeholder for when that field is added to User or Staff model
            const user = staff.user;
            yield this.alertService.createAlert({
                type: Alert_1.AlertType.LOCATION_DISABLED,
                severity: Alert_1.AlertSeverity.MEDIUM,
                staff: staffId,
                business: staff.business._id.toString(),
                department: (_b = (_a = staff.department) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(),
                title: "Location Tracking Disabled",
                message: `${staff.name} has disabled location tracking`,
                metadata: {
                    staffName: staff.name,
                    userEmail: (user === null || user === void 0 ? void 0 : user.email) || "N/A",
                    timestamp: new Date(),
                },
                priority: 3,
            });
            console.log(`[LocationAlert] Location disabled alert created for ${staff.name}`);
        });
    }
    /**
     * Generate alert when mocked/fake GPS is detected
     */
    generateMockedGPSAlert(attendanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const attendance = yield Attendance_1.Attendance.findById(attendanceId).populate({
                path: "staff",
                populate: [{ path: "business" }, { path: "department" }],
            });
            if (!attendance || !attendance.staff) {
                console.error(`[LocationAlert] Attendance not found: ${attendanceId}`);
                return;
            }
            const staff = attendance.staff;
            // Check if check-in location is mocked
            if (((_a = attendance.checkInLocation) === null || _a === void 0 ? void 0 : _a.mocked) === true) {
                yield this.alertService.createAlert({
                    type: Alert_1.AlertType.MOCKED_GPS,
                    severity: Alert_1.AlertSeverity.HIGH,
                    staff: staff._id.toString(),
                    business: staff.business._id.toString(),
                    department: (_c = (_b = staff.department) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString(),
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
                console.log(`[LocationAlert] Mocked GPS alert created for ${staff.name}`);
            }
            // Check if check-out location is mocked
            if (((_d = attendance.checkOutLocation) === null || _d === void 0 ? void 0 : _d.mocked) === true) {
                yield this.alertService.createAlert({
                    type: Alert_1.AlertType.MOCKED_GPS,
                    severity: Alert_1.AlertSeverity.HIGH,
                    staff: staff._id.toString(),
                    business: staff.business._id.toString(),
                    department: (_f = (_e = staff.department) === null || _e === void 0 ? void 0 : _e._id) === null || _f === void 0 ? void 0 : _f.toString(),
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
                console.log(`[LocationAlert] Mocked GPS alert created for ${staff.name} (checkout)`);
            }
        });
    }
    /**
     * Generate alert when check-in is outside allowed geo-fence
     */
    generateGeoViolationAlert(attendanceId_1, allowedLocations_1) {
        return __awaiter(this, arguments, void 0, function* (attendanceId, allowedLocations, maxDistance = 500 // meters
        ) {
            var _a, _b;
            const attendance = yield Attendance_1.Attendance.findById(attendanceId).populate({
                path: "staff",
                populate: [{ path: "business" }, { path: "department" }],
            });
            if (!attendance || !attendance.staff || !attendance.checkInLocation) {
                return;
            }
            const staff = attendance.staff;
            const checkInLoc = attendance.checkInLocation;
            // Check if check-in location is within allowed radius
            const isWithinGeoFence = allowedLocations.some((allowedLoc) => {
                const distance = this.calculateDistance(checkInLoc.latitude, checkInLoc.longitude, allowedLoc.latitude, allowedLoc.longitude);
                return distance <= maxDistance;
            });
            if (!isWithinGeoFence && allowedLocations.length > 0) {
                // Calculate distance to nearest allowed location
                const nearestLocation = allowedLocations[0];
                const distance = this.calculateDistance(checkInLoc.latitude, checkInLoc.longitude, nearestLocation.latitude, nearestLocation.longitude);
                yield this.alertService.createAlert({
                    type: Alert_1.AlertType.GEO_VIOLATION,
                    severity: Alert_1.AlertSeverity.HIGH,
                    staff: staff._id.toString(),
                    business: staff.business._id.toString(),
                    department: (_b = (_a = staff.department) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(),
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
                console.log(`[LocationAlert] Geo-violation alert created for ${staff.name} (${Math.round(distance)}m away)`);
            }
        });
    }
    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in meters
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    }
    /**
     * Batch check for location disabled across all active staff
     * (Can be run as a scheduled job)
     */
    checkAllStaffLocationStatus(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                isActive: true,
            };
            if (businessId) {
                query.business = businessId;
            }
            // Note: This would need to check User.locationEnabled or similar field
            // For now, this is a placeholder implementation
            const staffList = yield Staff_1.Staff.find(query).select("_id name");
            let alertsCreated = 0;
            // This would need actual logic to check location status from User model
            // For now, returning 0 as this requires the location tracking field to exist
            console.log(`[LocationAlert] Location status check completed (placeholder)`);
            return alertsCreated;
        });
    }
}
exports.default = LocationAlertGeneratorService;
