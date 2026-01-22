/**
 * Unit Tests for OfflineSyncService
 * Tests offline attendance synchronization logic
 */

import OfflineSyncService from '../../src/modules/offlineFaceRecognition/services/OfflineSyncService';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { SyncBatch, SyncBatchStatus } from '../../src/modules/offlineFaceRecognition/models/SyncBatch';
import { setupTestDB } from '../helpers/database';
import { mockObjectId, mockOfflineAttendanceRecord } from '../helpers/fixtures';

describe('OfflineSyncService', () => {
  setupTestDB();

  let syncService: OfflineSyncService;

  beforeEach(() => {
    syncService = new OfflineSyncService();
  });

  describe('processBatch', () => {
    it('should successfully process a batch of check-in records', async () => {
      const userId = mockObjectId().toString();
      const batchId = 'batch-test-123';

      const records = [
        {
          ...mockOfflineAttendanceRecord,
          localId: 'local-1',
          staffId: mockObjectId().toString(),
          type: 'check-in' as const
        },
        {
          ...mockOfflineAttendanceRecord,
          localId: 'local-2',
          staffId: mockObjectId().toString(),
          type: 'check-in' as const
        }
      ];

      const result = await syncService.processBatch(records, userId, batchId);

      expect(result.batchSummary.status).toBe(SyncBatchStatus.COMPLETED);
      expect(result.batchSummary.totalRecords).toBe(2);
      expect(result.batchSummary.processedRecords).toBe(2);
      expect(result.batchSummary.failedRecords).toBe(0);

      // Verify batch was created in database
      const syncBatch = await SyncBatch.findOne({ batchId });
      expect(syncBatch).toBeTruthy();
      expect(syncBatch?.status).toBe(SyncBatchStatus.COMPLETED);
    });

    it('should handle partial batch failure correctly', async () => {
      const userId = mockObjectId().toString();
      const batchId = 'batch-partial-123';

      const records = [
        {
          ...mockOfflineAttendanceRecord,
          localId: 'valid-1',
          staffId: mockObjectId().toString(),
          type: 'check-in' as const
        },
        {
          ...mockOfflineAttendanceRecord,
          localId: 'invalid-1',
          staffId: 'invalid-staff-id', // Invalid ObjectId
          type: 'check-in' as const
        }
      ];

      const result = await syncService.processBatch(records, userId, batchId);

      expect(result.batchSummary.status).toBe(SyncBatchStatus.PARTIAL);
      expect(result.batchSummary.totalRecords).toBe(2);
      expect(result.batchSummary.processedRecords).toBe(1);
      expect(result.batchSummary.failedRecords).toBe(1);

      // Verify error summary includes the failed record
      const syncBatch = await SyncBatch.findOne({ batchId });
      expect(syncBatch?.errorSummary).toHaveLength(1);
      expect(syncBatch?.errorSummary[0].localId).toBe('invalid-1');
    });

    it('should detect and flag GPS spoofing', async () => {
      const userId = mockObjectId().toString();
      const batchId = 'batch-gps-spoof-123';
      const staffId = mockObjectId().toString();

      const records = [
        {
          ...mockOfflineAttendanceRecord,
          localId: 'mocked-gps-1',
          staffId,
          type: 'check-in' as const,
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 10,
            mocked: true // GPS spoofing detected
          }
        }
      ];

      const result = await syncService.processBatch(records, userId, batchId);

      expect(result.batchSummary.status).toBe(SyncBatchStatus.COMPLETED);

      // Verify attendance was flagged for GPS spoofing
      const attendance = await Attendance.findOne({
        staff: staffId,
        'checkInLocation.mocked': true
      });

      expect(attendance).toBeTruthy();
      expect(attendance?.flagged).toBe(true);
      expect(attendance?.flagReason).toBe('gps_spoofing');
    });

    it('should prevent duplicate submissions using idempotency key', async () => {
      const userId = mockObjectId().toString();
      const staffId = mockObjectId().toString();
      const timestamp = Date.now();

      const record = {
        ...mockOfflineAttendanceRecord,
        localId: 'duplicate-test',
        staffId,
        type: 'check-in' as const,
        timestamp
      };

      // First submission
      const result1 = await syncService.processBatch([record], userId, 'batch-1');
      expect(result1.batchSummary.processedRecords).toBe(1);

      // Second submission (duplicate)
      const result2 = await syncService.processBatch([record], userId, 'batch-2');
      expect(result2.batchSummary.failedRecords).toBe(1);
      expect(result2.results[0].error).toContain('duplicate');

      // Verify only one attendance record exists
      const count = await Attendance.countDocuments({ staff: staffId });
      expect(count).toBe(1);
    });
  });

  describe('handleCheckOut', () => {
    it('should update existing attendance record on check-out', async () => {
      const staffId = mockObjectId();
      const checkInTime = new Date('2026-01-21T09:00:00Z');
      const checkOutTime = new Date('2026-01-21T17:00:00Z');

      // Create check-in record first
      const checkInAttendance = await Attendance.create({
        staff: staffId,
        date: new Date('2026-01-21'),
        checkInTime,
        checkInLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        status: 'checked-in'
      });

      // Now perform check-out
      const checkOutRecord = {
        localId: 'checkout-1',
        staffId: staffId.toString(),
        type: 'check-out' as const,
        timestamp: checkOutTime.getTime(),
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        }
      };

      const result = await syncService.processRecord(checkOutRecord, 'batch-checkout');

      expect(result.status).toBe('success');

      // Verify attendance was updated
      const updatedAttendance = await Attendance.findById(checkInAttendance._id);
      expect(updatedAttendance?.checkOutTime).toBeTruthy();
      expect(updatedAttendance?.status).toBe('checked-out');
    });

    it('should create orphan check-out when no check-in exists', async () => {
      const staffId = mockObjectId();
      const checkOutTime = new Date('2026-01-21T17:00:00Z');

      const checkOutRecord = {
        localId: 'orphan-checkout-1',
        staffId: staffId.toString(),
        type: 'check-out' as const,
        timestamp: checkOutTime.getTime(),
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        }
      };

      const result = await syncService.processRecord(checkOutRecord, 'batch-orphan');

      expect(result.status).toBe('success');

      // Verify orphan check-out was created
      const attendance = await Attendance.findOne({ staff: staffId });
      expect(attendance).toBeTruthy();
      expect(attendance?.checkInTime).toBeUndefined();
      expect(attendance?.checkOutTime).toBeTruthy();
      expect(attendance?.status).toBe('checked-out');
    });
  });

  describe('getSyncBatchStatus', () => {
    it('should return batch status for existing batch', async () => {
      const batchId = 'batch-status-test';
      const userId = mockObjectId();

      await SyncBatch.create({
        batchId,
        userId,
        totalRecords: 5,
        processedRecords: 5,
        failedRecords: 0,
        status: SyncBatchStatus.COMPLETED,
        errorSummary: [],
        startTime: new Date(),
        endTime: new Date(),
        duration: 1000
      });

      const status = await syncService.getSyncBatchStatus(batchId);

      expect(status).toBeTruthy();
      expect(status?.batchId).toBe(batchId);
      expect(status?.status).toBe(SyncBatchStatus.COMPLETED);
      expect(status?.totalRecords).toBe(5);
    });

    it('should return null for non-existent batch', async () => {
      const status = await syncService.getSyncBatchStatus('non-existent-batch');
      expect(status).toBeNull();
    });
  });

  describe('getUserSyncHistory', () => {
    it('should return user sync history with limit', async () => {
      const userId = mockObjectId();

      // Create multiple sync batches
      await SyncBatch.create([
        {
          batchId: 'batch-1',
          userId,
          totalRecords: 5,
          processedRecords: 5,
          failedRecords: 0,
          status: SyncBatchStatus.COMPLETED,
          startTime: new Date('2026-01-20'),
          endTime: new Date('2026-01-20'),
          duration: 1000
        },
        {
          batchId: 'batch-2',
          userId,
          totalRecords: 3,
          processedRecords: 3,
          failedRecords: 0,
          status: SyncBatchStatus.COMPLETED,
          startTime: new Date('2026-01-21'),
          endTime: new Date('2026-01-21'),
          duration: 800
        }
      ]);

      const history = await syncService.getUserSyncHistory(userId.toString(), 10);

      expect(history).toHaveLength(2);
      expect(history[0].batchId).toBe('batch-2'); // Most recent first
      expect(history[1].batchId).toBe('batch-1');
    });

    it('should respect limit parameter', async () => {
      const userId = mockObjectId();

      // Create 5 sync batches
      for (let i = 0; i < 5; i++) {
        await SyncBatch.create({
          batchId: `batch-${i}`,
          userId,
          totalRecords: 1,
          processedRecords: 1,
          failedRecords: 0,
          status: SyncBatchStatus.COMPLETED,
          startTime: new Date(),
          endTime: new Date(),
          duration: 500
        });
      }

      const history = await syncService.getUserSyncHistory(userId.toString(), 3);

      expect(history).toHaveLength(3);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('should generate consistent idempotency keys', () => {
      const staffId = '507f1f77bcf86cd799439011';
      const timestamp = 1642694400000;
      const type = 'check-in';
      const localId = 'local-123';

      const key1 = syncService['generateIdempotencyKey'](staffId, timestamp, type, localId);
      const key2 = syncService['generateIdempotencyKey'](staffId, timestamp, type, localId);

      expect(key1).toBe(key2);
      expect(key1).toContain('offline_');
      expect(key1).toContain(staffId);
      expect(key1).toContain(timestamp.toString());
    });

    it('should generate different keys for different inputs', () => {
      const key1 = syncService['generateIdempotencyKey']('staff1', 100, 'check-in', 'local1');
      const key2 = syncService['generateIdempotencyKey']('staff2', 100, 'check-in', 'local1');
      const key3 = syncService['generateIdempotencyKey']('staff1', 200, 'check-in', 'local1');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });
});
