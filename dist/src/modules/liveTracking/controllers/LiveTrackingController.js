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
                        remainingMs: 2 * 60 * 1000,
                    });
                    // Auto-expire: broadcast session-expired after 2 minutes
                    setTimeout(() => {
                        if (LiveTrackingService_1.default.isActive(staffId)) {
                            LiveTrackingService_1.default.stopSession(staffId);
                            io.to(`live-track:${staffId}`).emit("session-expired", { staffId });
                        }
                    }, 2 * 60 * 1000);
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
                if (!LiveTrackingService_1.default.isActive(staffId)) {
                    res.json({ success: true, data: { active: false } });
                    return;
                }
                try {
                    const io = (0, SocketServer_1.getIO)();
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
                res.json({ success: true, data: { active: true, remainingMs: LiveTrackingService_1.default.getRemainingMs(staffId) } });
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
    }
}
exports.default = LiveTrackingController;
