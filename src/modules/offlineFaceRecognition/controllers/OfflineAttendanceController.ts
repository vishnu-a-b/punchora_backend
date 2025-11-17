import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { randomUUID } from "crypto";

/**
 * OfflineAttendanceController
 * Handles batch attendance uploads from mobile offline recognition
 *
 * IMPORTANT: Reuses existing Attendance model but marks source as 'offline_mobile'
 * Does NOT modify existing face-api.js attendance logic
 */

// Import existing Attendance model (adjust path based on your structure)
// import Attendance from "../../attendance/models/Attendance";
// For now, we'll use a placeholder - adjust this import based on your actual Attendance model

interface AttendanceRecord {
  localId: string; // Temporary ID from mobile app
  staffId: string;
  timestamp: number;
  type: "IN" | "OUT";
  photoUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
  deviceId?: string;
}

interface BatchSyncRequest {
  records: AttendanceRecord[];
}

interface SyncResponse {
  success: boolean;
  results: {
    localId: string;
    status: "success" | "failed";
    serverId?: string;
    error?: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export class OfflineAttendanceController {
  /**
   * POST /v1/offline-face/sync-attendance
   * Batch upload attendance records from mobile
   */
  syncAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { records }: BatchSyncRequest = req.body;

      // Validate input
      if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          error: "records array is required and must not be empty",
        });
      }

      // Limit batch size
      if (records.length > 100) {
        return res.status(400).json({
          success: false,
          error: "Batch size cannot exceed 100 records",
        });
      }

      const syncBatchId = randomUUID();
      const results: SyncResponse["results"] = [];

      // Process each record
      for (const record of records) {
        try {
          // Validate record
          const validation = this.validateAttendanceRecord(record);
          if (!validation.valid) {
            results.push({
              localId: record.localId,
              status: "failed",
              error: validation.error,
            });
            continue;
          }

          // Create attendance record
          // NOTE: Adjust this based on your actual Attendance model
          const attendanceData = {
            staffId: new mongoose.Types.ObjectId(record.staffId),
            timestamp: new Date(record.timestamp),
            type: record.type,
            photoUrl: record.photoUrl,
            location: record.location,
            deviceId: record.deviceId,
            syncBatchId,
            source: "offline_mobile", // Mark as offline mobile source
            createdAt: new Date(),
          };

          // Save to database
          // const attendance = await Attendance.create(attendanceData);

          // PLACEHOLDER: Replace with actual Attendance model save
          // For now, we'll just log it
          console.log("📝 Would save attendance:", attendanceData);

          // Simulate successful save
          const mockId = new mongoose.Types.ObjectId();

          results.push({
            localId: record.localId,
            status: "success",
            serverId: mockId.toString(),
          });

          console.log(
            `✅ Synced attendance for staff ${record.staffId} at ${new Date(
              record.timestamp
            ).toISOString()}`
          );
        } catch (error: any) {
          console.error(
            `❌ Failed to sync record ${record.localId}:`,
            error
          );
          results.push({
            localId: record.localId,
            status: "failed",
            error: error.message || "Unknown error",
          });
        }
      }

      // Calculate summary
      const successful = results.filter((r) => r.status === "success").length;
      const failed = results.filter((r) => r.status === "failed").length;

      const response: SyncResponse = {
        success: failed === 0,
        results,
        summary: {
          total: records.length,
          successful,
          failed,
        },
      };

      console.log(
        `📊 Batch sync complete: ${successful}/${records.length} successful`
      );

      res.status(200).json(response);
    } catch (error: any) {
      console.error("Error syncing attendance:", error);
      next(error);
    }
  };

  /**
   * Validate attendance record
   */
  private validateAttendanceRecord(
    record: AttendanceRecord
  ): { valid: boolean; error?: string } {
    if (!record.localId) {
      return { valid: false, error: "localId is required" };
    }

    if (!record.staffId || !mongoose.Types.ObjectId.isValid(record.staffId)) {
      return { valid: false, error: "Valid staffId is required" };
    }

    if (!record.timestamp || isNaN(record.timestamp)) {
      return { valid: false, error: "Valid timestamp is required" };
    }

    if (!record.type || !["IN", "OUT"].includes(record.type)) {
      return { valid: false, error: "type must be 'IN' or 'OUT'" };
    }

    // Validate timestamp is not in future
    if (record.timestamp > Date.now()) {
      return { valid: false, error: "Timestamp cannot be in the future" };
    }

    // Validate timestamp is not too old (e.g., more than 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    if (record.timestamp < thirtyDaysAgo) {
      return { valid: false, error: "Timestamp is too old (>30 days)" };
    }

    return { valid: true };
  }

  /**
   * GET /v1/offline-face/attendance-status/:syncBatchId
   * Get status of a sync batch
   */
  getAttendanceSyncStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { syncBatchId } = req.params;

      // Query attendance records by syncBatchId
      // const records = await Attendance.find({ syncBatchId });

      // PLACEHOLDER: Replace with actual query
      res.status(200).json({
        success: true,
        syncBatchId,
        count: 0, // records.length
        message: "Sync batch status endpoint (placeholder)",
      });
    } catch (error: any) {
      console.error("Error getting sync status:", error);
      next(error);
    }
  };
}

export default new OfflineAttendanceController();
