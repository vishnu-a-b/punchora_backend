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
const LiveTrackingService_1 = __importDefault(require("../services/LiveTrackingService"));
const SocketServer_1 = require("../../../socket/SocketServer");
const Staff_1 = require("../../staff/models/Staff");
const LocationData_1 = require("../../location/models/LocationData");
class LiveTrackingController {
    constructor() {
        // Admin: start a 2-minute live tracking session for a staff member
        this.startTracking = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { staffId } = req.body;
                if (!staffId) {
                    res.status(400).json({ success: false, message: "staffId is required" });
                    return;
                }
                const adminUserId = req.user._id.toString();
                const session = LiveTrackingService_1.default.startSession(staffId, adminUserId);
                // Notify any connected admin sockets that tracking started
                try {
                    const io = (0, SocketServer_1.getIO)();
                    io.to(`live-track:${staffId}`).emit("tracking-started", {
                        staffId,
                        expiresAt: session.expiresAt,
                        remainingMs: 5 * 60 * 1000,
                    });
                    // Auto-expire: broadcast session-expired after 5 minutes
                    setTimeout(() => {
                        if (LiveTrackingService_1.default.isActive(staffId)) {
                            LiveTrackingService_1.default.stopSession(staffId);
                            io.to(`live-track:${staffId}`).emit("session-expired", { staffId });
                        }
                    }, 5 * 60 * 1000);
                }
                catch (_) {
                    // Socket may not be initialized yet, REST response still works
                }
                res.json({
                    success: true,
                    data: {
                        staffId: session.staffId,
                        expiresAt: session.expiresAt,
                        remainingMs: LiveTrackingService_1.default.getRemainingMs(staffId),
                    },
                });
            }
            catch (e) {
                next(e);
            }
        });
        // Admin: manually stop tracking
        this.stopTracking = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { staffId } = req.params;
                LiveTrackingService_1.default.stopSession(staffId);
                try {
                    const io = (0, SocketServer_1.getIO)();
                    io.to(`live-track:${staffId}`).emit("tracking-stopped", { staffId });
                }
                catch (_) { }
                res.json({ success: true });
            }
            catch (e) {
                next(e);
            }
        });
        // Mobile: check if this staff member is being live-tracked
        this.checkActive = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { staffId } = req.params;
                const active = LiveTrackingService_1.default.isActive(staffId);
                const remainingMs = LiveTrackingService_1.default.getRemainingMs(staffId);
                res.json({ success: true, data: { active, remainingMs } });
            }
            catch (e) {
                next(e);
            }
        });
        // Mobile: receive location and broadcast to admin (NO database write)
        this.receiveLocation = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { staffId, latitude, longitude, accuracy, timestamp } = req.body;
                const io = (0, SocketServer_1.getIO)();
                // Individual session broadcast (only when a session is active)
                if (LiveTrackingService_1.default.isActive(staffId)) {
                    try {
                        io.to(`live-track:${staffId}`).emit("live-location", {
                            staffId,
                            latitude,
                            longitude,
                            accuracy: accuracy || null,
                            timestamp: timestamp || new Date().toISOString(),
                            remainingMs: LiveTrackingService_1.default.getRemainingMs(staffId),
                        });
                    }
                    catch (_) { }
                }
                // Department fan-out — only query DB if someone is watching the dept room
                try {
                    const staffDoc = yield Staff_1.Staff.findById(staffId).select("department name").lean();
                    if (staffDoc === null || staffDoc === void 0 ? void 0 : staffDoc.department) {
                        const deptId = staffDoc.department.toString();
                        const room = io.sockets.adapter.rooms.get(`live-dept:${deptId}`);
                        if (room && room.size > 0) {
                            io.to(`live-dept:${deptId}`).emit("dept-live-location", {
                                staffId,
                                staffName: staffDoc.name,
                                departmentId: deptId,
                                latitude,
                                longitude,
                                accuracy: accuracy || null,
                                timestamp: timestamp || new Date().toISOString(),
                            });
                        }
                    }
                }
                catch (_) { /* non-fatal */ }
                const active = LiveTrackingService_1.default.isActive(staffId);
                res.json({ success: true, data: { active, remainingMs: active ? LiveTrackingService_1.default.getRemainingMs(staffId) : 0 } });
            }
            catch (e) {
                next(e);
            }
        });
        // Get all currently active live tracking sessions (admin dashboard overview)
        this.getActiveSessions = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessions = LiveTrackingService_1.default.getAllActiveSessions();
                res.json({ success: true, data: sessions });
            }
            catch (e) {
                next(e);
            }
        });
        // Admin: get all outside-staff in a department with last known location today
        this.getDepartmentStaff = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { departmentId } = req.params;
                const staffMembers = yield Staff_1.Staff.find({
                    $or: [{ department: departmentId }, { additionalDepartments: departmentId }],
                    type: "outside-staff",
                    isActive: true,
                }).select("_id name").lean();
                if (!staffMembers.length) {
                    res.json({ success: true, data: [] });
                    return;
                }
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);
                const lastLocations = yield LocationData_1.LocationData.aggregate([
                    {
                        $match: {
                            staff: { $in: staffMembers.map((s) => s._id) },
                            date: { $gte: startOfDay, $lte: endOfDay },
                        },
                    },
                    { $sort: { date: -1 } },
                    {
                        $group: {
                            _id: "$staff",
                            latitude: { $first: "$latitude" },
                            longitude: { $first: "$longitude" },
                            lastSeen: { $first: "$date" },
                        },
                    },
                ]);
                const locMap = new Map(lastLocations.map((l) => [l._id.toString(), l]));
                const result = staffMembers.map((s) => {
                    var _a, _b, _c;
                    const loc = locMap.get(s._id.toString());
                    return {
                        staffId: s._id.toString(),
                        staffName: s.name,
                        latitude: (_a = loc === null || loc === void 0 ? void 0 : loc.latitude) !== null && _a !== void 0 ? _a : null,
                        longitude: (_b = loc === null || loc === void 0 ? void 0 : loc.longitude) !== null && _b !== void 0 ? _b : null,
                        lastSeen: (_c = loc === null || loc === void 0 ? void 0 : loc.lastSeen) !== null && _c !== void 0 ? _c : null,
                    };
                });
                res.json({ success: true, data: result });
            }
            catch (e) {
                next(e);
            }
        });
    }
}
exports.default = LiveTrackingController;
