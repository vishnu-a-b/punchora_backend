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
Object.defineProperty(exports, "__esModule", { value: true });
const LocationAlert_1 = require("../models/LocationAlert");
const FailedLocationAttempt_1 = require("../models/FailedLocationAttempt");
const LocationData_1 = require("../models/LocationData");
class LocationAlertService {
    constructor() {
        // Create a new alert
        this.create = (body) => __awaiter(this, void 0, void 0, function* () {
            return yield LocationAlert_1.LocationAlert.create(body);
        });
        // Get all alerts with filtering
        this.list = (_a) => __awaiter(this, [_a], void 0, function* ({ limit = 50, skip = 0, acknowledged, alertType, severity, businessId, }) {
            const query = {};
            if (acknowledged !== undefined) {
                query.acknowledged = acknowledged;
            }
            if (alertType) {
                query.alertType = alertType;
            }
            if (severity) {
                query.severity = severity;
            }
            const pipeline = [
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
            pipeline.push({
                $sort: { createdAt: -1 },
            }, {
                $skip: skip,
            }, {
                $limit: limit,
            }, {
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
            });
            const alerts = yield LocationAlert_1.LocationAlert.aggregate(pipeline);
            const total = yield LocationAlert_1.LocationAlert.countDocuments(query);
            return {
                total,
                limit,
                skip,
                items: alerts,
            };
        });
        // Acknowledge an alert
        this.acknowledge = (alertId, userId) => __awaiter(this, void 0, void 0, function* () {
            return yield LocationAlert_1.LocationAlert.findByIdAndUpdate(alertId, {
                acknowledged: true,
                acknowledgedBy: userId,
                acknowledgedAt: new Date(),
            }, { new: true });
        });
        // Resolve an alert
        this.resolve = (alertId) => __awaiter(this, void 0, void 0, function* () {
            return yield LocationAlert_1.LocationAlert.findByIdAndUpdate(alertId, {
                resolvedAt: new Date(),
            }, { new: true });
        });
        // Auto-generate alerts based on location data
        this.generateAlertsFromFailedAttempts = () => __awaiter(this, void 0, void 0, function* () {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            // Find recent failed attempts
            const failedAttempts = yield FailedLocationAttempt_1.FailedLocationAttempt.find({
                attemptTime: { $gte: tenMinutesAgo },
                reason: { $in: ["location_off", "permission_denied"] },
            }).populate("staff");
            const alerts = [];
            for (const attempt of failedAttempts) {
                // Check if alert already exists for this staff in the last 30 minutes
                const existingAlert = yield LocationAlert_1.LocationAlert.findOne({
                    staff: attempt.staff,
                    alertType: attempt.reason === "location_off"
                        ? "location_disabled"
                        : "permission_denied",
                    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
                });
                if (!existingAlert) {
                    const alert = yield this.create({
                        staff: attempt.staff,
                        alertType: attempt.reason === "location_off"
                            ? "location_disabled"
                            : "permission_denied",
                        severity: "high",
                        message: attempt.reason === "location_off"
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
        });
        // Auto-generate alerts for mocked GPS
        this.generateAlertsFromMockedGPS = () => __awaiter(this, void 0, void 0, function* () {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            // Find recent mocked locations
            const mockedLocations = yield LocationData_1.LocationData.find({
                date: { $gte: oneHourAgo },
                mocked: true,
            }).populate("staff");
            // Group by staff
            const staffMockCounts = {};
            for (const loc of mockedLocations) {
                const staffId = loc.staff._id.toString();
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
                    const existingAlert = yield LocationAlert_1.LocationAlert.findOne({
                        staff: staffId,
                        alertType: "mocked_gps",
                        createdAt: { $gte: oneHourAgo },
                    });
                    if (!existingAlert) {
                        const alert = yield this.create({
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
        });
        // Delete old resolved alerts (cleanup)
        this.cleanupOldAlerts = (...args_1) => __awaiter(this, [...args_1], void 0, function* (daysOld = 30) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const result = yield LocationAlert_1.LocationAlert.deleteMany({
                resolvedAt: { $lt: cutoffDate },
            });
            return result.deletedCount;
        });
    }
}
exports.default = LocationAlertService;
