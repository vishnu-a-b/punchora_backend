/**
 * Sync Priority Service
 * Prioritizes offline attendance records for optimal processing order
 * Phase 6: Mobile Sync Optimization
 */

export enum SyncPriority {
  CHECK_IN = 1,      // Highest priority - check-ins first
  CHECK_OUT = 2,     // Second - check-outs
  ACTIVITY = 3,      // Third - activities
  UPDATE = 4,        // Lowest - updates to existing records
}

export interface PrioritizedRecord {
  record: any;
  priority: SyncPriority;
  timestamp: number;
  staffId: string;
}

export default class SyncPriorityService {
  /**
   * Prioritize records for processing
   * Check-ins are processed first, then check-outs, then activities
   */
  prioritize(records: any[]): PrioritizedRecord[] {
    const prioritized: PrioritizedRecord[] = records.map(record => {
      const priority = this.determinePriority(record);

      return {
        record,
        priority,
        timestamp: record.timestamp,
        staffId: record.staffId
      };
    });

    // Sort by priority (ascending), then by timestamp (ascending)
    prioritized.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority number = higher priority
      }
      return a.timestamp - b.timestamp; // Earlier timestamp first
    });

    return prioritized;
  }

  /**
   * Determine priority based on record type
   */
  private determinePriority(record: any): SyncPriority {
    const type = (record.type || '').toLowerCase();

    if (type === 'check-in' || type === 'in') {
      return SyncPriority.CHECK_IN;
    } else if (type === 'check-out' || type === 'out') {
      return SyncPriority.CHECK_OUT;
    } else if (type === 'activity' || type.includes('activity')) {
      return SyncPriority.ACTIVITY;
    } else {
      return SyncPriority.UPDATE;
    }
  }

  /**
   * Group prioritized records by staff
   * This allows parallel processing per staff while maintaining order within staff
   */
  groupByStaff(prioritizedRecords: PrioritizedRecord[]): Map<string, PrioritizedRecord[]> {
    const grouped = new Map<string, PrioritizedRecord[]>();

    for (const item of prioritizedRecords) {
      const staffId = item.staffId;

      if (!grouped.has(staffId)) {
        grouped.set(staffId, []);
      }

      grouped.get(staffId)!.push(item);
    }

    return grouped;
  }

  /**
   * Get processing order statistics
   */
  getStatistics(records: any[]): {
    total: number;
    byPriority: Record<SyncPriority, number>;
    byStaff: number;
  } {
    const prioritized = this.prioritize(records);
    const grouped = this.groupByStaff(prioritized);

    const byPriority: Record<SyncPriority, number> = {
      [SyncPriority.CHECK_IN]: 0,
      [SyncPriority.CHECK_OUT]: 0,
      [SyncPriority.ACTIVITY]: 0,
      [SyncPriority.UPDATE]: 0,
    };

    prioritized.forEach(item => {
      byPriority[item.priority]++;
    });

    return {
      total: records.length,
      byPriority,
      byStaff: grouped.size
    };
  }

  /**
   * Validate record ordering
   * Ensures check-ins come before check-outs for the same staff/day
   */
  validateOrdering(staffRecords: PrioritizedRecord[]): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    let hasCheckIn = false;

    for (const item of staffRecords) {
      if (item.priority === SyncPriority.CHECK_OUT && !hasCheckIn) {
        issues.push(`Check-out found before check-in for staff ${item.staffId}`);
      }

      if (item.priority === SyncPriority.CHECK_IN) {
        hasCheckIn = true;
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Chunk records into batches for parallel processing
   * Each batch will be processed concurrently
   */
  chunkIntoProcessingBatches(
    groupedByStaff: Map<string, PrioritizedRecord[]>,
    maxConcurrent: number = 10
  ): PrioritizedRecord[][] {
    const staffIds = Array.from(groupedByStaff.keys());
    const batches: PrioritizedRecord[][] = [];

    // Create batches of staff IDs
    for (let i = 0; i < staffIds.length; i += maxConcurrent) {
      const batchStaffIds = staffIds.slice(i, i + maxConcurrent);
      const batchRecords: PrioritizedRecord[] = [];

      // Collect all records for this batch of staff
      for (const staffId of batchStaffIds) {
        const staffRecords = groupedByStaff.get(staffId) || [];
        batchRecords.push(...staffRecords);
      }

      if (batchRecords.length > 0) {
        batches.push(batchRecords);
      }
    }

    return batches;
  }
}
