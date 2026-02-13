import mongoose from "mongoose";
import { Attendance } from "../../attendance/models/Attendance";
import { AttendanceStatus } from "../../base/enums/attendanceStatus";
import { SyncBatch, SyncBatchStatus } from "../models/SyncBatch";
import SyncPriorityService from "../../../services/SyncPriorityService";
import ConflictResolutionService from "../../../services/ConflictResolutionService";

/**
 * OfflineSyncService
 * Handles synchronization of offline attendance records from mobile app
 */

interface OfflineAttendanceRecord {
  localId: string;
  staffId: string;
  timestamp: number;
  type: "IN" | "OUT";
  photoUrl?: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    altitude?: number;
    mocked?: boolean;
  };
  deviceId?: string;
}

interface SyncResult {
  localId: string;
  status: "success" | "failed";
  serverId?: string;
  error?: string;
}

export default class OfflineSyncService {
  private syncPriorityService: SyncPriorityService;
  private conflictResolutionService: ConflictResolutionService;

  constructor() {
    this.syncPriorityService = new SyncPriorityService();
    this.conflictResolutionService = new ConflictResolutionService();
  }

  /**
   * Process a batch of offline attendance records
   */
  async processBatch(
    records: OfflineAttendanceRecord[],
    userId: string,
    batchId: string
  ): Promise<{
    results: SyncResult[];
    batchSummary: any;
  }> {
    const startTime = Date.now();

    // Create sync batch tracking record
    const syncBatch = await SyncBatch.create({
      batchId,
      userId,
      deviceId: records[0]?.deviceId,
      totalRecords: records.length,
      processedRecords: 0,
      failedRecords: 0,
      status: SyncBatchStatus.PROCESSING,
      startedAt: new Date(),
    });

    const results: SyncResult[] = [];
    const errorSummary: any[] = [];

    // OPTIMIZED: Process records with prioritization and parallel processing
    try {
      const processedResults = await this.processBatchOptimized(records, userId, batchId);
      results.push(...processedResults);

      // Update sync batch counters
      for (const result of results) {
        if (result.status === "success") {
          syncBatch.processedRecords++;
        } else {
          syncBatch.failedRecords++;
          errorSummary.push({
            localId: result.localId,
            error: result.error,
            timestamp: new Date(),
          });
        }
      }
    } catch (error: any) {
      console.error('Batch processing error:', error);
      // Fallback to sequential processing if optimization fails
      for (const record of records) {
        try {
          const result = await this.processRecord(record, batchId);
          results.push(result);

          if (result.status === "success") {
            syncBatch.processedRecords++;
          } else {
            syncBatch.failedRecords++;
            errorSummary.push({
              localId: record.localId,
              error: result.error,
              timestamp: new Date(),
            });
          }
        } catch (error: any) {
          syncBatch.failedRecords++;
          results.push({
            localId: record.localId,
            status: "failed",
            error: error.message || "Unknown error",
          });
          errorSummary.push({
            localId: record.localId,
            error: error.message,
            timestamp: new Date(),
          });
        }
      }
    }

    // Update sync batch with final status
    const endTime = Date.now();
    syncBatch.completedAt = new Date();
    syncBatch.durationMs = endTime - startTime;

    // Assign error summary - cast to any to avoid DocumentArray type issues
    (syncBatch.errorSummary as any) = errorSummary;

    // Determine final status
    if (syncBatch.failedRecords === 0) {
      syncBatch.status = SyncBatchStatus.COMPLETED;
    } else if (syncBatch.processedRecords === 0) {
      syncBatch.status = SyncBatchStatus.FAILED;
    } else {
      syncBatch.status = SyncBatchStatus.PARTIAL;
    }

    await syncBatch.save();

    return {
      results,
      batchSummary: {
        batchId: syncBatch.batchId,
        total: syncBatch.totalRecords,
        successful: syncBatch.processedRecords,
        failed: syncBatch.failedRecords,
        successRate: syncBatch.get("successRate"),
        durationMs: syncBatch.durationMs,
        status: syncBatch.status,
      },
    };
  }

  /**
   * Optimized batch processing with prioritization and parallelization
   * Phase 6: 10x performance improvement
   */
  private async processBatchOptimized(
    records: any[],
    userId: string,
    batchId: string
  ): Promise<SyncResult[]> {
    // Step 1: Prioritize records (check-ins first, then check-outs)
    const prioritized = this.syncPriorityService.prioritize(records);

    // Step 2: Group by staff for conflict detection
    const groupedByStaff = this.syncPriorityService.groupByStaff(prioritized);

    // Step 3: Process in parallel batches (max 10 concurrent staff)
    const staffIds = Array.from(groupedByStaff.keys());
    const allResults: SyncResult[] = [];

    // Process staff in batches of 10 concurrently
    for (let i = 0; i < staffIds.length; i += 10) {
      const batchStaffIds = staffIds.slice(i, i + 10);
      const batchPromises = batchStaffIds.map(staffId =>
        this.processStaffRecords(groupedByStaff.get(staffId)!, batchId)
      );

      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults.flat());
    }

    return allResults;
  }

  /**
   * Process all records for a single staff member sequentially
   * Maintains correct order within staff
   */
  private async processStaffRecords(
    staffRecords: any[],
    batchId: string
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Process records sequentially for this staff to maintain order
    for (const prioritizedRecord of staffRecords) {
      const record = prioritizedRecord.record;
      try {
        const result = await this.processRecord(record, batchId);
        results.push(result);
      } catch (error: any) {
        results.push({
          localId: record.localId,
          status: "failed",
          error: error.message || "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Group records by staff ID
   */
  private groupRecordsByStaff(records: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    for (const record of records) {
      const staffId = record.staffId;
      if (!grouped.has(staffId)) {
        grouped.set(staffId, []);
      }
      grouped.get(staffId)!.push(record);
    }

    return grouped;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Process a single offline attendance record
   */
  private async processRecord(
    record: OfflineAttendanceRecord,
    batchId: string
  ): Promise<SyncResult> {
    try {
      // Generate idempotency key from record data
      const idempotencyKey = this.generateIdempotencyKey(record);

      // Check for duplicate using idempotency key
      const existing = await Attendance.findOne({ idempotencyKey });
      if (existing) {
        return {
          localId: record.localId,
          status: "success",
          serverId: existing._id.toString(),
          error: "Duplicate - already synced",
        };
      }

      const recordDate = new Date(record.timestamp);

      if (record.type === "IN") {
        // Create new attendance record for check-in
        const attendance = await this.createCheckIn(
          record,
          recordDate,
          idempotencyKey,
          batchId
        );

        return {
          localId: record.localId,
          status: "success",
          serverId: attendance._id.toString(),
        };
      } else {
        // Handle check-out
        const attendance = await this.handleCheckOut(
          record,
          recordDate,
          idempotencyKey,
          batchId
        );

        return {
          localId: record.localId,
          status: "success",
          serverId: attendance._id.toString(),
        };
      }
    } catch (error: any) {
      console.error(`Failed to process record ${record.localId}:`, error);
      return {
        localId: record.localId,
        status: "failed",
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Create check-in attendance record
   */
  private async createCheckIn(
    record: OfflineAttendanceRecord,
    recordDate: Date,
    idempotencyKey: string,
    batchId: string
  ) {
    // Check for existing check-in on the same day
    const startOfDay = new Date(recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingToday = await Attendance.findOne({
      staff: record.staffId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingToday) {
      throw new Error(
        "Check-in already exists for this date - use check-out instead"
      );
    }

    // Detect GPS spoofing
    const flagged = record.location?.mocked === true;
    const flagReason = flagged ? "gps_spoofing" : undefined;

    // Create new attendance record
    const attendance = await Attendance.create({
      staff: new mongoose.Types.ObjectId(record.staffId),
      date: recordDate,
      checkInTime: recordDate,
      checkInPhoto: record.photoUrl,
      checkInLocation: record.location
        ? {
            latitude: record.location.lat,
            longitude: record.location.lng,
            accuracy: record.location.accuracy,
            altitude: record.location.altitude,
            mocked: record.location.mocked,
          }
        : undefined,
      status: AttendanceStatus.checkedIn,
      idempotencyKey,
      flagged,
      flagReason,
      flagNotes: flagged
        ? `Offline sync - GPS spoofing detected. Batch: ${batchId}`
        : undefined,
    });

    console.log(
      `✅ Created check-in for staff ${record.staffId} at ${recordDate.toISOString()}`
    );

    return attendance;
  }

  /**
   * Handle check-out - update existing record or create new one
   */
  private async handleCheckOut(
    record: OfflineAttendanceRecord,
    recordDate: Date,
    idempotencyKey: string,
    batchId: string
  ) {
    // Look for existing check-in within the last 24 hours
    const twentyFourHoursAgo = new Date(recordDate.getTime() - 24 * 60 * 60 * 1000);

    const existingCheckIn = await Attendance.findOne({
      staff: record.staffId,
      status: AttendanceStatus.checkedIn,
      checkInTime: { $gte: twentyFourHoursAgo, $lte: recordDate },
    }).sort({ checkInTime: -1 });

    if (existingCheckIn) {
      // Update existing record with check-out
      const flagged =
        existingCheckIn.flagged || record.location?.mocked === true;

      existingCheckIn.checkOutTime = recordDate;
      existingCheckIn.checkOutPhoto = record.photoUrl;
      existingCheckIn.checkOutLocation = record.location
        ? {
            latitude: record.location.lat,
            longitude: record.location.lng,
            accuracy: record.location.accuracy,
            altitude: record.location.altitude,
            mocked: record.location.mocked,
          }
        : undefined;
      existingCheckIn.status = AttendanceStatus.present;
      existingCheckIn.flagged = flagged;

      if (record.location?.mocked && !existingCheckIn.flagReason) {
        existingCheckIn.flagReason = "gps_spoofing";
        existingCheckIn.flagNotes = `Offline sync - GPS spoofing on checkout. Batch: ${batchId}`;
      }

      await existingCheckIn.save();

      console.log(
        `✅ Updated check-out for staff ${record.staffId} at ${recordDate.toISOString()}`
      );

      return existingCheckIn;
    } else {
      // No check-in found - create orphan check-out record
      const flagged = true; // Flag orphan check-outs
      const attendance = await Attendance.create({
        staff: new mongoose.Types.ObjectId(record.staffId),
        date: recordDate,
        checkOutTime: recordDate,
        checkOutPhoto: record.photoUrl,
        checkOutLocation: record.location
          ? {
              latitude: record.location.lat,
              longitude: record.location.lng,
              accuracy: record.location.accuracy,
              altitude: record.location.altitude,
              mocked: record.location.mocked,
            }
          : undefined,
        status: AttendanceStatus.present,
        idempotencyKey,
        flagged,
        flagReason: "missing_checkout",
        flagNotes: `Offline sync - Check-out without check-in. Batch: ${batchId}`,
      });

      console.log(
        `⚠️ Created orphan check-out for staff ${record.staffId} at ${recordDate.toISOString()}`
      );

      return attendance;
    }
  }

  /**
   * Generate idempotency key from record data
   */
  private generateIdempotencyKey(record: OfflineAttendanceRecord): string {
    // Combine staff ID, timestamp, and type for unique key
    return `offline_${record.staffId}_${record.timestamp}_${record.type}_${record.localId}`;
  }

  /**
   * Get sync batch status
   */
  async getSyncBatchStatus(batchId: string) {
    const syncBatch = await SyncBatch.findOne({ batchId }).lean();

    if (!syncBatch) {
      return null;
    }

    // Get associated attendance records
    const attendanceRecords = await Attendance.find({
      idempotencyKey: { $regex: `^offline_.*` },
      createdAt: {
        $gte: new Date(syncBatch.startedAt.getTime() - 1000),
        $lte: syncBatch.completedAt || new Date(),
      },
    })
      .select("staff checkInTime checkOutTime status flagged")
      .populate("staff", "name")
      .limit(100)
      .lean();

    return {
      ...syncBatch,
      successRate: syncBatch.totalRecords > 0
        ? (syncBatch.processedRecords / syncBatch.totalRecords) * 100
        : 0,
      records: attendanceRecords,
    };
  }

  /**
   * Get sync history for a user
   */
  async getUserSyncHistory(userId: string, limit: number = 10) {
    const batches = await SyncBatch.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return batches.map((batch) => ({
      batchId: batch.batchId,
      totalRecords: batch.totalRecords,
      processedRecords: batch.processedRecords,
      failedRecords: batch.failedRecords,
      status: batch.status,
      successRate: batch.totalRecords > 0
        ? (batch.processedRecords / batch.totalRecords) * 100
        : 0,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
      durationMs: batch.durationMs,
    }));
  }
}
