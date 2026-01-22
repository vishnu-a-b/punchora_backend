"use strict";
/**
 * Report Service
 *
 * Provides analytics and reporting capabilities for Control Room.
 * Generates comprehensive reports on location tracking, attendance, and alerts.
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
const Staff_1 = require("../../staff/models/Staff");
const Attendance_1 = require("../../attendance/models/Attendance");
const Alert_1 = require("../../alert/models/Alert");
const mongoose_1 = __importDefault(require("mongoose"));
class ReportService {
    /**
     * REPORT 1: Location Compliance Report
     * Shows which staff have location tracking enabled/disabled
     */
    generateLocationComplianceReport(dateRange_1) {
        return __awaiter(this, arguments, void 0, function* (dateRange, filter = {}) {
            const query = { isActive: true };
            if (filter.business)
                query.business = filter.business;
            if (filter.department)
                query.department = filter.department;
            // Get all active staff
            const allStaff = yield Staff_1.Staff.find(query)
                .populate("business", "name")
                .populate("department", "name")
                .populate("user", "email")
                .lean();
            // PHASE 5 OPTIMIZATION: Use aggregation instead of N+1 queries
            // Single query that calculates all metrics per staff in one go
            const attendanceMetrics = yield Attendance_1.Attendance.aggregate([
                {
                    $match: {
                        date: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                        staff: { $in: allStaff.map((s) => s._id) },
                    },
                },
                {
                    $group: {
                        _id: "$staff",
                        hasLocationData: {
                            $max: {
                                $cond: [
                                    {
                                        $or: [
                                            { $ifNull: ["$checkInLocation.latitude", false] },
                                            { $ifNull: ["$checkOutLocation.latitude", false] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        mockedGPSCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ["$checkInLocation.mocked", true] },
                                            { $eq: ["$checkOutLocation.mocked", true] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        lastCheckInTime: { $last: "$checkInTime" },
                        lastCheckInAccuracy: { $last: "$checkInLocation.accuracy" },
                    },
                },
            ]);
            // Create lookup map for O(1) access
            const metricsMap = new Map(attendanceMetrics.map((m) => [m._id.toString(), m]));
            // Combine staff data with attendance metrics
            const staffWithLocationData = allStaff.map((staff) => {
                var _a, _b;
                const metrics = metricsMap.get(staff._id.toString());
                return {
                    staffId: staff._id,
                    staffName: staff.name,
                    staffUid: staff.uid,
                    business: (_a = staff.business) === null || _a === void 0 ? void 0 : _a.name,
                    department: (_b = staff.department) === null || _b === void 0 ? void 0 : _b.name,
                    hasLocationData: metrics ? metrics.hasLocationData === 1 : false,
                    lastLocationTimestamp: (metrics === null || metrics === void 0 ? void 0 : metrics.lastCheckInTime) || null,
                    mockedGPSCount: (metrics === null || metrics === void 0 ? void 0 : metrics.mockedGPSCount) || 0,
                    locationAccuracy: (metrics === null || metrics === void 0 ? void 0 : metrics.lastCheckInAccuracy) || "N/A",
                };
            });
            // Calculate summary statistics
            const totalStaff = staffWithLocationData.length;
            const staffWithLocation = staffWithLocationData.filter(s => s.hasLocationData).length;
            const staffWithoutLocation = totalStaff - staffWithLocation;
            const staffWithMockedGPS = staffWithLocationData.filter(s => s.mockedGPSCount > 0).length;
            const complianceRate = totalStaff > 0 ? ((staffWithLocation / totalStaff) * 100).toFixed(2) : 0;
            return {
                reportId: new mongoose_1.default.Types.ObjectId().toString(),
                reportType: "location_compliance",
                generatedAt: new Date(),
                dateRange,
                filter,
                summary: {
                    totalStaff,
                    staffWithLocation,
                    staffWithoutLocation,
                    staffWithMockedGPS,
                    complianceRate: parseFloat(complianceRate),
                },
                details: staffWithLocationData,
            };
        });
    }
    /**
     * REPORT 2: Attendance Anomalies Report
     * Identifies suspicious or unusual attendance patterns
     */
    generateAttendanceAnomaliesReport(dateRange_1) {
        return __awaiter(this, arguments, void 0, function* (dateRange, filter = {}) {
            var _a, _b, _c, _d;
            const query = {
                date: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            };
            if (filter.business) {
                const staffIds = yield Staff_1.Staff.find({ business: filter.business }).distinct("_id");
                query.staff = { $in: staffIds };
            }
            // PHASE 5 OPTIMIZATION: Added .lean() for read-only query
            // Find all attendance records in range
            const attendanceRecords = yield Attendance_1.Attendance.find(query)
                .populate({
                path: "staff",
                select: "name uid",
                populate: [
                    { path: "business", select: "name" },
                    { path: "department", select: "name" },
                ],
            })
                .lean();
            const anomalies = [];
            for (const record of attendanceRecords) {
                const recordAnomalies = [];
                // Check 1: Very short work duration (< 1 hour)
                if (record.checkInTime && record.checkOutTime) {
                    const duration = record.checkOutTime.getTime() - record.checkInTime.getTime();
                    const hours = duration / (1000 * 60 * 60);
                    if (hours < 1) {
                        recordAnomalies.push(`Very short duration (${Math.round(hours * 60)} min)`);
                    }
                    // Check 2: Unusually long duration (> 16 hours)
                    if (hours > 16) {
                        recordAnomalies.push(`Very long duration (${Math.round(hours)} hours)`);
                    }
                }
                // Check 3: Missing checkout
                if (record.checkInTime && !record.checkOutTime) {
                    recordAnomalies.push("Missing checkout");
                }
                // Check 4: Mocked GPS
                if (((_a = record.checkInLocation) === null || _a === void 0 ? void 0 : _a.mocked) || ((_b = record.checkOutLocation) === null || _b === void 0 ? void 0 : _b.mocked)) {
                    recordAnomalies.push("GPS spoofing detected");
                }
                // Check 5: Weekend attendance
                const dayOfWeek = record.date.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    recordAnomalies.push("Weekend attendance");
                }
                // Check 6: Flagged by Control Room
                if (record.flagged) {
                    recordAnomalies.push(`Flagged: ${record.flagReason}`);
                }
                // If anomalies found, add to report
                if (recordAnomalies.length > 0) {
                    anomalies.push({
                        attendanceId: record._id,
                        date: record.date,
                        staff: {
                            id: record.staff._id,
                            name: record.staff.name,
                            uid: record.staff.uid,
                        },
                        business: (_c = record.staff.business) === null || _c === void 0 ? void 0 : _c.name,
                        department: (_d = record.staff.department) === null || _d === void 0 ? void 0 : _d.name,
                        checkInTime: record.checkInTime,
                        checkOutTime: record.checkOutTime,
                        anomalies: recordAnomalies,
                        flagged: record.flagged,
                        flagStatus: record.flagStatus,
                    });
                }
            }
            // Group anomalies by type
            const anomalyTypes = {};
            anomalies.forEach(a => {
                a.anomalies.forEach((type) => {
                    anomalyTypes[type] = (anomalyTypes[type] || 0) + 1;
                });
            });
            return {
                reportId: new mongoose_1.default.Types.ObjectId().toString(),
                reportType: "attendance_anomalies",
                generatedAt: new Date(),
                dateRange,
                filter,
                summary: {
                    totalRecordsChecked: attendanceRecords.length,
                    anomaliesFound: anomalies.length,
                    anomalyRate: attendanceRecords.length > 0
                        ? ((anomalies.length / attendanceRecords.length) * 100).toFixed(2)
                        : 0,
                    anomalyTypes,
                },
                anomalies,
            };
        });
    }
    /**
     * REPORT 3: Late Check-ins Report
     * Shows staff who checked in late
     */
    generateLateCheckinsReport(dateRange_1) {
        return __awaiter(this, arguments, void 0, function* (dateRange, filter = {}) {
            var _a, _b;
            const thresholdMinutes = filter.thresholdMinutes || 30; // Default: 30 minutes late
            const query = {
                date: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                checkInTime: { $exists: true },
            };
            if (filter.business) {
                const staffIds = yield Staff_1.Staff.find({ business: filter.business }).distinct("_id");
                query.staff = { $in: staffIds };
            }
            const attendanceRecords = yield Attendance_1.Attendance.find(query)
                .populate({
                path: "staff",
                populate: [
                    { path: "business", select: "name" },
                    { path: "department", select: "name" },
                ],
            })
                .lean();
            const lateCheckIns = [];
            for (const record of attendanceRecords) {
                if (!record.checkInTime)
                    continue;
                // Get expected check-in time (9:00 AM for simplicity)
                const expectedTime = new Date(record.date);
                expectedTime.setHours(9, 0, 0, 0);
                // Calculate how late
                const actualTime = new Date(record.checkInTime);
                const minutesLate = (actualTime.getTime() - expectedTime.getTime()) / (1000 * 60);
                if (minutesLate > thresholdMinutes) {
                    lateCheckIns.push({
                        attendanceId: record._id,
                        date: record.date,
                        staff: {
                            id: record.staff._id,
                            name: record.staff.name,
                            uid: record.staff.uid,
                        },
                        business: (_a = record.staff.business) === null || _a === void 0 ? void 0 : _a.name,
                        department: (_b = record.staff.department) === null || _b === void 0 ? void 0 : _b.name,
                        expectedTime,
                        actualCheckInTime: record.checkInTime,
                        minutesLate: Math.round(minutesLate),
                        location: record.checkInLocation ? {
                            latitude: record.checkInLocation.latitude,
                            longitude: record.checkInLocation.longitude,
                        } : null,
                    });
                }
            }
            // Sort by minutes late (most late first)
            lateCheckIns.sort((a, b) => b.minutesLate - a.minutesLate);
            return {
                reportId: new mongoose_1.default.Types.ObjectId().toString(),
                reportType: "late_checkins",
                generatedAt: new Date(),
                dateRange,
                filter,
                configuration: {
                    thresholdMinutes,
                },
                summary: {
                    totalCheckIns: attendanceRecords.length,
                    lateCheckIns: lateCheckIns.length,
                    lateRate: attendanceRecords.length > 0
                        ? ((lateCheckIns.length / attendanceRecords.length) * 100).toFixed(2)
                        : 0,
                    averageMinutesLate: lateCheckIns.length > 0
                        ? Math.round(lateCheckIns.reduce((sum, r) => sum + r.minutesLate, 0) / lateCheckIns.length)
                        : 0,
                },
                lateCheckIns,
            };
        });
    }
    /**
     * REPORT 4: Alert Summary Report
     * Shows statistics on alerts generated
     */
    generateAlertSummaryReport(dateRange_1) {
        return __awaiter(this, arguments, void 0, function* (dateRange, filter = {}) {
            const query = {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            };
            if (filter.business)
                query.business = filter.business;
            // Get all alerts in range
            const alerts = yield Alert_1.Alert.find(query)
                .populate("staff", "name uid")
                .populate("business", "name")
                .lean();
            // Group by type
            const alertsByType = {};
            alerts.forEach(alert => {
                alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
            });
            // Group by severity
            const alertsBySeverity = {};
            alerts.forEach(alert => {
                alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
            });
            // Group by status
            const alertsByStatus = {};
            alerts.forEach(alert => {
                alertsByStatus[alert.status] = (alertsByStatus[alert.status] || 0) + 1;
            });
            // Calculate acknowledgment metrics
            const acknowledgedAlerts = alerts.filter(a => a.acknowledged);
            const resolvedAlerts = alerts.filter(a => a.resolved);
            const avgAcknowledgmentTime = acknowledgedAlerts.length > 0
                ? acknowledgedAlerts.reduce((sum, a) => {
                    if (a.acknowledgedAt) {
                        return sum + (a.acknowledgedAt.getTime() - a.createdAt.getTime());
                    }
                    return sum;
                }, 0) / acknowledgedAlerts.length / (1000 * 60) // Convert to minutes
                : 0;
            // Top staff with most alerts
            const staffAlertCounts = {};
            alerts.forEach(alert => {
                var _a, _b, _c, _d;
                const staffId = (_b = (_a = alert.staff) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (staffId) {
                    if (!staffAlertCounts[staffId]) {
                        staffAlertCounts[staffId] = {
                            staffId,
                            staffName: (_c = alert.staff) === null || _c === void 0 ? void 0 : _c.name,
                            staffUid: (_d = alert.staff) === null || _d === void 0 ? void 0 : _d.uid,
                            count: 0,
                        };
                    }
                    staffAlertCounts[staffId].count++;
                }
            });
            const topStaff = Object.values(staffAlertCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            return {
                reportId: new mongoose_1.default.Types.ObjectId().toString(),
                reportType: "alert_summary",
                generatedAt: new Date(),
                dateRange,
                filter,
                summary: {
                    totalAlerts: alerts.length,
                    activeAlerts: alertsByStatus.active || 0,
                    acknowledgedAlerts: acknowledgedAlerts.length,
                    resolvedAlerts: resolvedAlerts.length,
                    acknowledgmentRate: alerts.length > 0
                        ? ((acknowledgedAlerts.length / alerts.length) * 100).toFixed(2)
                        : 0,
                    resolutionRate: alerts.length > 0
                        ? ((resolvedAlerts.length / alerts.length) * 100).toFixed(2)
                        : 0,
                    avgAcknowledgmentTimeMinutes: Math.round(avgAcknowledgmentTime),
                },
                breakdown: {
                    byType: alertsByType,
                    bySeverity: alertsBySeverity,
                    byStatus: alertsByStatus,
                },
                topStaffWithAlerts: topStaff,
            };
        });
    }
    /**
     * REPORT 5: Comprehensive Control Room Dashboard Report
     * Combines key metrics from all reports
     */
    generateDashboardReport(dateRange_1) {
        return __awaiter(this, arguments, void 0, function* (dateRange, filter = {}) {
            // Run all reports in parallel
            const [locationReport, anomaliesReport, lateCheckinsReport, alertReport] = yield Promise.all([
                this.generateLocationComplianceReport(dateRange, filter),
                this.generateAttendanceAnomaliesReport(dateRange, filter),
                this.generateLateCheckinsReport(dateRange, filter),
                this.generateAlertSummaryReport(dateRange, filter),
            ]);
            return {
                reportId: new mongoose_1.default.Types.ObjectId().toString(),
                reportType: "dashboard",
                generatedAt: new Date(),
                dateRange,
                filter,
                metrics: {
                    locationCompliance: {
                        complianceRate: locationReport.summary.complianceRate,
                        staffWithoutLocation: locationReport.summary.staffWithoutLocation,
                        mockedGPSCount: locationReport.summary.staffWithMockedGPS,
                    },
                    attendanceAnomalies: {
                        anomalyRate: anomaliesReport.summary.anomalyRate,
                        totalAnomalies: anomaliesReport.summary.anomaliesFound,
                        topAnomalyTypes: Object.entries(anomaliesReport.summary.anomalyTypes)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5),
                    },
                    lateCheckIns: {
                        lateRate: lateCheckinsReport.summary.lateRate,
                        totalLate: lateCheckinsReport.summary.lateCheckIns,
                        avgMinutesLate: lateCheckinsReport.summary.averageMinutesLate,
                    },
                    alerts: {
                        totalAlerts: alertReport.summary.totalAlerts,
                        activeAlerts: alertReport.summary.activeAlerts,
                        acknowledgmentRate: alertReport.summary.acknowledgmentRate,
                        topAlertTypes: Object.entries(alertReport.breakdown.byType)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5),
                    },
                },
                detailedReports: {
                    locationCompliance: locationReport,
                    attendanceAnomalies: anomaliesReport,
                    lateCheckIns: lateCheckinsReport,
                    alerts: alertReport,
                },
            };
        });
    }
}
exports.default = ReportService;
