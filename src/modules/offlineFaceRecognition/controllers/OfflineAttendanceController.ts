import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import OfflineSyncService from "../services/OfflineSyncService";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import { GPSValidator, TimestampValidator, ObjectIdValidator } from "../../../utils/securityValidation";

/**
 * OfflineAttendanceController
 * Handles batch attendance uploads from mobile offline recognition
 *
 * PHASE 5: Complete implementation with real database integration
 * - Uses OfflineSyncService for processing
 * - Tracks sync batches in SyncBatch model
 * - Integrates with existing Attendance model
 */

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
  batchId?: string;
  batchStatus?: string;
  successRate?: number;
  durationMs?: number;
}

export class OfflineAttendanceController {
  private syncService = new OfflineSyncService();

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
      const user = (req as any).user;

      // Validate user authentication
      if (!user || !user._id) {
        throw new BadRequestError({ error: "User authentication required" });
      }

      // Validate input
      if (!records || !Array.isArray(records) || records.length === 0) {
        throw new BadRequestError({
          error: "records array is required and must not be empty",
        });
      }

      // Limit batch size
      if (records.length > 100) {
        throw new BadRequestError({
          error: "Batch size cannot exceed 100 records",
        });
      }

      console.log(
        `📥 Starting batch sync: ${records.length} records for user ${user._id}`
      );

      // Validate all records first
      const validationErrors: { localId: string; error: string }[] = [];
      for (const record of records) {
        const validation = this.validateAttendanceRecord(record);
        if (!validation.valid) {
          validationErrors.push({
            localId: record.localId,
            error: validation.error!,
          });
        }
      }

      // If any validation errors, return them without processing
      if (validationErrors.length > 0) {
        console.warn(
          `⚠️ Validation failed for ${validationErrors.length} records`
        );
        return res.status(400).json({
          success: false,
          error: "Validation failed for some records",
          validationErrors,
        });
      }

      // Generate unique batch ID
      const syncBatchId = randomUUID();

      // Process batch using service
      const { results, batchSummary } = await this.syncService.processBatch(
        records,
        user._id.toString(),
        syncBatchId
      );

      const response: SyncResponse = {
        success: batchSummary.failed === 0,
        results,
        summary: {
          total: batchSummary.total,
          successful: batchSummary.successful,
          failed: batchSummary.failed,
        },
        batchId: syncBatchId,
        batchStatus: batchSummary.status,
        successRate: batchSummary.successRate,
        durationMs: batchSummary.durationMs,
      };

      console.log(
        `📊 Batch sync complete: ${batchSummary.successful}/${batchSummary.total} successful (${batchSummary.successRate.toFixed(1)}%)`
      );

      res.status(200).json(response);
    } catch (error: any) {
      console.error("Error syncing attendance:", error);
      next(error);
    }
  };

  /**
   * Validate attendance record
   * PHASE 5 DAY 10: Enhanced with security validation utilities
   */
  private validateAttendanceRecord(
    record: AttendanceRecord
  ): { valid: boolean; error?: string } {
    // Validate localId
    if (!record.localId) {
      return { valid: false, error: "localId is required" };
    }

    // Validate staffId using ObjectIdValidator
    const staffIdValidation = ObjectIdValidator.isValidObjectId(record.staffId);
    if (!staffIdValidation.valid) {
      return { valid: false, error: `Invalid staffId: ${staffIdValidation.error}` };
    }

    // Validate timestamp using TimestampValidator
    const timestampValidation = TimestampValidator.isValidTimestamp(record.timestamp, {
      maxPastHours: 720, // 30 days
      maxFutureMinutes: 5 // Allow 5 minutes for clock skew
    });
    if (!timestampValidation.valid) {
      return { valid: false, error: `Invalid timestamp: ${timestampValidation.error}` };
    }

    // Validate type
    if (!record.type || !["IN", "OUT"].includes(record.type)) {
      return { valid: false, error: "type must be 'IN' or 'OUT'" };
    }

    // Validate GPS location if provided
    if (record.location) {
      const locationValidation = GPSValidator.isValidLocation(record.location);
      if (!locationValidation.valid) {
        return { valid: false, error: `Invalid location: ${locationValidation.error}` };
      }

      // Detect GPS spoofing patterns
      const spoofingCheck = GPSValidator.detectSpoofingPatterns(record.location);
      if (spoofingCheck.spoofed) {
        console.warn(
          `⚠️ GPS spoofing detected for record ${record.localId}: ${spoofingCheck.reasons.join(', ')}`
        );
        // Note: We don't reject spoofed GPS, just log and flag it
      }
    }

    return { valid: true };
  }

  /**
   * GET /v1/offline-face/sync-status/:batchId
   * Get status of a sync batch
   */
  getSyncBatchStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { batchId } = req.params;

      console.log(`📊 Fetching sync batch status for: ${batchId}`);

      const batchStatus = await this.syncService.getSyncBatchStatus(batchId);

      if (!batchStatus) {
        throw new NotFoundError({ error: "Sync batch not found" });
      }

      res.status(200).json({
        success: true,
        data: batchStatus,
      });
    } catch (error: any) {
      console.error("Error getting sync status:", error);
      next(error);
    }
  };

  /**
   * GET /v1/offline-face/sync-history
   * Get sync history for current user
   */
  getUserSyncHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).user;

      if (!user || !user._id) {
        throw new BadRequestError({ error: "User authentication required" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      console.log(`📊 Fetching sync history for user: ${user._id}`);

      const history = await this.syncService.getUserSyncHistory(
        user._id.toString(),
        limit
      );

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error("Error getting sync history:", error);
      next(error);
    }
  };
}

export default new OfflineAttendanceController();
