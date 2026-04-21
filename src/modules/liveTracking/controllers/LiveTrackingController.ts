import { Request, Response, NextFunction } from "express";
import liveTrackingService from "../services/LiveTrackingService";
import { getIO } from "../../../socket/SocketServer";
import { Staff } from "../../staff/models/Staff";
import { LocationData } from "../../location/models/LocationData";

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
          remainingMs: 5 * 60 * 1000,
        });

        // Auto-expire: broadcast session-expired after 5 minutes
        setTimeout(() => {
          if (liveTrackingService.isActive(staffId)) {
            liveTrackingService.stopSession(staffId);
            io.to(`live-track:${staffId}`).emit("session-expired", { staffId });
          }
        }, 5 * 60 * 1000);
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
      const io = getIO();

      // Individual session broadcast (only when a session is active)
      if (liveTrackingService.isActive(staffId)) {
        try {
          io.to(`live-track:${staffId}`).emit("live-location", {
            staffId,
            latitude,
            longitude,
            accuracy: accuracy || null,
            timestamp: timestamp || new Date().toISOString(),
            remainingMs: liveTrackingService.getRemainingMs(staffId),
          });
        } catch (_) {}
      }

      // Department fan-out — only query DB if someone is watching the dept room
      try {
        const staffDoc = await Staff.findById(staffId).select("department name").lean();
        if (staffDoc?.department) {
          const deptId = staffDoc.department.toString();
          const room = io.sockets.adapter.rooms.get(`live-dept:${deptId}`);
          if (room && room.size > 0) {
            io.to(`live-dept:${deptId}`).emit("dept-live-location", {
              staffId,
              staffName: (staffDoc as any).name,
              departmentId: deptId,
              latitude,
              longitude,
              accuracy: accuracy || null,
              timestamp: timestamp || new Date().toISOString(),
            });
          }
        }
      } catch (_) { /* non-fatal */ }

      const active = liveTrackingService.isActive(staffId);
      res.json({ success: true, data: { active, remainingMs: active ? liveTrackingService.getRemainingMs(staffId) : 0 } });
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

  // Admin: get all outside-staff in a department with last known location today
  getDepartmentStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId } = req.params;

      const staffMembers = await Staff.find({
        $or: [{ department: departmentId }, { additionalDepartments: departmentId }],
        type: "outside-staff",
        isActive: true,
      }).select("_id name").lean();

      if (!staffMembers.length) {
        res.json({ success: true, data: [] });
        return;
      }

      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();   endOfDay.setHours(23, 59, 59, 999);

      const lastLocations = await LocationData.aggregate([
        {
          $match: {
            staff: { $in: staffMembers.map((s: any) => s._id) },
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

      const locMap = new Map(lastLocations.map((l: any) => [l._id.toString(), l]));
      const result = staffMembers.map((s: any) => {
        const loc = locMap.get(s._id.toString());
        return {
          staffId: s._id.toString(),
          staffName: s.name,
          latitude: loc?.latitude ?? null,
          longitude: loc?.longitude ?? null,
          lastSeen: loc?.lastSeen ?? null,
        };
      });

      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  };
}
