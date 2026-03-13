import { Request, Response, NextFunction } from "express";
import liveTrackingService from "../services/LiveTrackingService";
import { getIO } from "../../../socket/SocketServer";

export default class LiveTrackingController {

  // Admin: start a 2-minute live tracking session for a staff member
  startTracking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { staffId } = req.body;
      if (!staffId) {
        res.status(400).json({ success: false, message: "staffId is required" });
        return;
      }

      const adminUserId = (req.user as any)._id.toString();
      const session = liveTrackingService.startSession(staffId, adminUserId);

      // Notify any connected admin sockets that tracking started
      try {
        const io = getIO();
        io.to(`live-track:${staffId}`).emit("tracking-started", {
          staffId,
          expiresAt: session.expiresAt,
          remainingMs: 2 * 60 * 1000,
        });

        // Auto-expire: broadcast session-expired after 2 minutes
        setTimeout(() => {
          if (liveTrackingService.isActive(staffId)) {
            liveTrackingService.stopSession(staffId);
            io.to(`live-track:${staffId}`).emit("session-expired", { staffId });
          }
        }, 2 * 60 * 1000);
      } catch (_) {
        // Socket may not be initialized yet, REST response still works
      }

      res.json({
        success: true,
        data: {
          staffId: session.staffId,
          expiresAt: session.expiresAt,
          remainingMs: liveTrackingService.getRemainingMs(staffId),
        },
      });
    } catch (e) {
      next(e);
    }
  };

  // Admin: manually stop tracking
  stopTracking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { staffId } = req.params;
      liveTrackingService.stopSession(staffId);

      try {
        const io = getIO();
        io.to(`live-track:${staffId}`).emit("tracking-stopped", { staffId });
      } catch (_) {}

      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  };

  // Mobile: check if this staff member is being live-tracked
  checkActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { staffId } = req.params;
      const active = liveTrackingService.isActive(staffId);
      const remainingMs = liveTrackingService.getRemainingMs(staffId);
      res.json({ success: true, data: { active, remainingMs } });
    } catch (e) {
      next(e);
    }
  };

  // Mobile: receive location and broadcast to admin (NO database write)
  receiveLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { staffId, latitude, longitude, accuracy, timestamp } = req.body;

      if (!liveTrackingService.isActive(staffId)) {
        res.json({ success: true, data: { active: false } });
        return;
      }

      try {
        const io = getIO();
        io.to(`live-track:${staffId}`).emit("live-location", {
          staffId,
          latitude,
          longitude,
          accuracy: accuracy || null,
          timestamp: timestamp || new Date().toISOString(),
          remainingMs: liveTrackingService.getRemainingMs(staffId),
        });
      } catch (_) {}

      res.json({ success: true, data: { active: true, remainingMs: liveTrackingService.getRemainingMs(staffId) } });
    } catch (e) {
      next(e);
    }
  };

  // Get all currently active live tracking sessions (admin dashboard overview)
  getActiveSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = liveTrackingService.getAllActiveSessions();
      res.json({ success: true, data: sessions });
    } catch (e) {
      next(e);
    }
  };
}
