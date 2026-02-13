/**
 * Conflict Resolution Service
 * Detects and resolves conflicts during offline sync
 * Phase 6: Mobile Sync Optimization
 */

import { Attendance } from '../modules/attendance/models/Attendance';
import AuditService from '../modules/audit/services/AuditService';

export enum ConflictType {
  DUPLICATE = 'duplicate',                    // Same record already exists
  TIMESTAMP_MISMATCH = 'timestamp_mismatch',  // Different timestamp for same event
  DATA_DIVERGENCE = 'data_divergence',        // Different data for same record
  ORDERING_ISSUE = 'ordering_issue',          // Check-out before check-in
}

export enum ResolutionStrategy {
  LOCAL_WINS = 'local_wins',           // Use local (mobile) version
  SERVER_WINS = 'server_wins',         // Use server version
  LAST_WRITE_WINS = 'last_write_wins', // Use most recent timestamp
  MANUAL_REVIEW = 'manual_review',     // Flag for manual resolution
  MERGE = 'merge',                     // Merge both versions
}

export interface Conflict {
  localRecord: any;
  serverRecord?: any;
  conflictType: ConflictType;
  resolution: ResolutionStrategy;
  reason: string;
  metadata?: any;
}

export interface ConflictResolutionResult {
  resolved: any[];
  conflicts: Conflict[];
  autoResolved: number;
  manualReview: number;
}

export default class ConflictResolutionService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Detect conflicts between local and server records
   */
  async detectConflicts(records: any[]): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    for (const record of records) {
      const conflict = await this.checkForConflict(record);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  /**
   * Check if a single record has conflicts
   */
  private async checkForConflict(localRecord: any): Promise<Conflict | null> {
    const { staffId, timestamp, type } = localRecord;

    // Find existing attendance record for the same day
    const recordDate = new Date(timestamp);
    const startOfDay = new Date(recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await Attendance.findOne({
      staff: staffId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!existingRecord) {
      return null; // No conflict
    }

    // Check for duplicate
    const isDuplicate = this.isDuplicate(localRecord, existingRecord);
    if (isDuplicate) {
      return {
        localRecord,
        serverRecord: existingRecord,
        conflictType: ConflictType.DUPLICATE,
        resolution: ResolutionStrategy.SERVER_WINS,
        reason: 'Record already exists on server'
      };
    }

    // Check for timestamp mismatch
    const timestampConflict = this.hasTimestampConflict(localRecord, existingRecord);
    if (timestampConflict) {
      return {
        localRecord,
        serverRecord: existingRecord,
        conflictType: ConflictType.TIMESTAMP_MISMATCH,
        resolution: ResolutionStrategy.LAST_WRITE_WINS,
        reason: 'Different timestamps for same event',
        metadata: {
          localTime: timestamp,
          serverTime: this.getServerTimestamp(existingRecord, type)
        }
      };
    }

    // Check for data divergence
    const dataDivergence = this.hasDataDivergence(localRecord, existingRecord);
    if (dataDivergence) {
      return {
        localRecord,
        serverRecord: existingRecord,
        conflictType: ConflictType.DATA_DIVERGENCE,
        resolution: ResolutionStrategy.MANUAL_REVIEW,
        reason: 'Data mismatch between local and server',
        metadata: dataDivergence
      };
    }

    return null;
  }

  /**
   * Check if record is a duplicate
   */
  private isDuplicate(localRecord: any, serverRecord: any): boolean {
    const type = (localRecord.type || '').toLowerCase();
    const localTimestamp = new Date(localRecord.timestamp).getTime();

    let serverTimestamp: number | undefined;

    if (type === 'check-in' || type === 'in') {
      serverTimestamp = serverRecord.checkInTime?.getTime();
    } else if (type === 'check-out' || type === 'out') {
      serverTimestamp = serverRecord.checkOutTime?.getTime();
    }

    if (!serverTimestamp) {
      return false;
    }

    // Consider duplicate if timestamps are within 5 seconds
    const timeDiff = Math.abs(localTimestamp - serverTimestamp);
    return timeDiff < 5000;
  }

  /**
   * Check for timestamp conflicts
   */
  private hasTimestampConflict(localRecord: any, serverRecord: any): boolean {
    const type = (localRecord.type || '').toLowerCase();
    const localTimestamp = new Date(localRecord.timestamp).getTime();

    let serverTimestamp: number | undefined;

    if (type === 'check-in' || type === 'in') {
      serverTimestamp = serverRecord.checkInTime?.getTime();
    } else if (type === 'check-out' || type === 'out') {
      serverTimestamp = serverRecord.checkOutTime?.getTime();
    }

    if (!serverTimestamp) {
      return false;
    }

    // Conflict if timestamps differ by more than 5 seconds but less than 1 hour
    const timeDiff = Math.abs(localTimestamp - serverTimestamp);
    return timeDiff > 5000 && timeDiff < 3600000;
  }

  /**
   * Check for data divergence
   */
  private hasDataDivergence(localRecord: any, serverRecord: any): any {
    const divergence: any = {};
    let hasDivergence = false;

    // Check location divergence
    if (localRecord.location && serverRecord.checkInLocation) {
      const localLat = localRecord.location.lat || localRecord.location.latitude;
      const serverLat = serverRecord.checkInLocation.latitude;
      const localLng = localRecord.location.lng || localRecord.location.longitude;
      const serverLng = serverRecord.checkInLocation.longitude;

      const latDiff = Math.abs(localLat - serverLat);
      const lngDiff = Math.abs(localLng - serverLng);

      // Significant location difference (>0.001 degrees ~= 100m)
      if (latDiff > 0.001 || lngDiff > 0.001) {
        divergence.location = {
          local: { lat: localLat, lng: localLng },
          server: { lat: serverLat, lng: serverLng }
        };
        hasDivergence = true;
      }
    }

    return hasDivergence ? divergence : null;
  }

  /**
   * Get server timestamp for comparison
   */
  private getServerTimestamp(serverRecord: any, type: string): number | undefined {
    const recordType = type.toLowerCase();

    if (recordType === 'check-in' || recordType === 'in') {
      return serverRecord.checkInTime?.getTime();
    } else if (recordType === 'check-out' || recordType === 'out') {
      return serverRecord.checkOutTime?.getTime();
    }

    return undefined;
  }

  /**
   * Resolve conflicts using configured strategies
   */
  async resolveConflicts(conflicts: Conflict[]): Promise<ConflictResolutionResult> {
    const resolved: any[] = [];
    const manualReviewItems: Conflict[] = [];
    let autoResolved = 0;

    for (const conflict of conflicts) {
      const resolution = await this.applyResolution(conflict);

      if (resolution.requiresManualReview) {
        manualReviewItems.push(conflict);
      } else {
        resolved.push(resolution.record);
        autoResolved++;

        // Log auto-resolution to audit
        await this.auditService.logAsync({
          action: 'CONFLICT_AUTO_RESOLVED' as any,
          resource: 'OfflineSync',
          metadata: {
            conflictType: conflict.conflictType,
            resolution: conflict.resolution,
            reason: conflict.reason,
            staffId: conflict.localRecord.staffId
          },
          status: 'success'
        });
      }
    }

    return {
      resolved,
      conflicts: manualReviewItems,
      autoResolved,
      manualReview: manualReviewItems.length
    };
  }

  /**
   * Apply resolution strategy to a conflict
   */
  private async applyResolution(conflict: Conflict): Promise<{
    record: any;
    requiresManualReview: boolean;
  }> {
    switch (conflict.resolution) {
      case ResolutionStrategy.LOCAL_WINS:
        return {
          record: conflict.localRecord,
          requiresManualReview: false
        };

      case ResolutionStrategy.SERVER_WINS:
        return {
          record: conflict.serverRecord,
          requiresManualReview: false
        };

      case ResolutionStrategy.LAST_WRITE_WINS:
        const localTime = new Date(conflict.localRecord.timestamp).getTime();
        const serverTime = conflict.serverRecord?.updatedAt?.getTime() || 0;

        return {
          record: localTime > serverTime ? conflict.localRecord : conflict.serverRecord,
          requiresManualReview: false
        };

      case ResolutionStrategy.MERGE:
        const merged = this.mergeRecords(conflict.localRecord, conflict.serverRecord);
        return {
          record: merged,
          requiresManualReview: false
        };

      case ResolutionStrategy.MANUAL_REVIEW:
      default:
        return {
          record: conflict.localRecord,
          requiresManualReview: true
        };
    }
  }

  /**
   * Merge local and server records
   */
  private mergeRecords(localRecord: any, serverRecord: any): any {
    // Prefer local data for most fields, server for IDs
    return {
      ...serverRecord,
      ...localRecord,
      _id: serverRecord?._id, // Keep server ID
      mergedAt: new Date(),
      mergeSource: 'conflict_resolution'
    };
  }

  /**
   * Get conflict statistics
   */
  getConflictStatistics(conflicts: Conflict[]): {
    total: number;
    byType: Record<ConflictType, number>;
    byResolution: Record<ResolutionStrategy, number>;
  } {
    const byType: Record<ConflictType, number> = {
      [ConflictType.DUPLICATE]: 0,
      [ConflictType.TIMESTAMP_MISMATCH]: 0,
      [ConflictType.DATA_DIVERGENCE]: 0,
      [ConflictType.ORDERING_ISSUE]: 0,
    };

    const byResolution: Record<ResolutionStrategy, number> = {
      [ResolutionStrategy.LOCAL_WINS]: 0,
      [ResolutionStrategy.SERVER_WINS]: 0,
      [ResolutionStrategy.LAST_WRITE_WINS]: 0,
      [ResolutionStrategy.MANUAL_REVIEW]: 0,
      [ResolutionStrategy.MERGE]: 0,
    };

    conflicts.forEach(conflict => {
      byType[conflict.conflictType]++;
      byResolution[conflict.resolution]++;
    });

    return {
      total: conflicts.length,
      byType,
      byResolution
    };
  }
}
