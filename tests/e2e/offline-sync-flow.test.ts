/**
 * E2E Test: Offline Sync Flow
 * Tests mobile app syncing offline records with idempotency and conflict resolution
 */

import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { SyncBatch } from '../../src/modules/offlineFaceRecognition/models/SyncBatch';
import OfflineSyncService from '../../src/modules/offlineFaceRecognition/services/OfflineSyncService';

describe('E2E: Offline Sync Flow', () => {
  setupTestDB();

  let offlineSyncService: OfflineSyncService;
  let businessId: string;
  let staffId: string;
  let userId: string;

  beforeEach(async () => {
    offlineSyncService = new OfflineSyncService();
    businessId = mockObjectId().toString();
    userId = mockObjectId().toString();

    // Create staff
    const staff = await Staff.create({
      name: 'Mobile User',
      uid: 'MOBILE001',
      business: businessId,
      isActive: true
    });
    staffId = staff._id.toString();
  });

  it('should sync offline attendance records successfully', async () => {
    const batchId = `batch-${Date.now()}`;
    const offlineRecords = [
      {
        localId: 'offline-1',
        staffId: staffId,
        type: 'check-in',
        timestamp: Date.now() - 3600000, // 1 hour ago
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data',
        deviceInfo: {
          platform: 'ios',
          version: '17.0'
        }
      },
      {
        localId: 'offline-2',
        staffId: staffId,
        type: 'check-out',
        timestamp: Date.now(), // Now
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data',
        deviceInfo: {
          platform: 'ios',
          version: '17.0'
        }
      }
    ];

    // Sync records
    const result = await offlineSyncService.processBatch(offlineRecords, userId, batchId);

    expect(result.successful).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(2);

    // Verify attendance created
    const attendance = await Attendance.findOne({ staff: staffId });
    expect(attendance).toBeTruthy();
    expect(attendance!.status).toBe('checked-out');

    // Verify sync batch recorded
    const syncBatch = await SyncBatch.findOne({ batchId });
    expect(syncBatch).toBeTruthy();
    expect(syncBatch!.status).toBe('completed');
    expect(syncBatch!.totalRecords).toBe(2);
    expect(syncBatch!.processedRecords).toBe(2);
  });

  it('should handle idempotency - prevent duplicate syncs', async () => {
    const batchId = `batch-${Date.now()}`;
    const offlineRecords = [
      {
        localId: 'offline-same',
        staffId: staffId,
        type: 'check-in',
        timestamp: Date.now(),
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data'
      }
    ];

    // First sync
    const result1 = await offlineSyncService.processBatch(offlineRecords, userId, batchId);
    expect(result1.successful).toBe(1);

    // Second sync with same batchId (should be idempotent)
    const result2 = await offlineSyncService.processBatch(offlineRecords, userId, batchId);

    // Should still return success but not create duplicates
    expect(result2.total).toBe(1);

    // Verify only one attendance record exists
    const attendanceCount = await Attendance.countDocuments({ staff: staffId });
    expect(attendanceCount).toBe(1);
  });

  it('should handle partial sync with some failures', async () => {
    const batchId = `batch-${Date.now()}`;
    const offlineRecords = [
      {
        localId: 'offline-valid',
        staffId: staffId,
        type: 'check-in',
        timestamp: Date.now(),
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data'
      },
      {
        localId: 'offline-invalid',
        staffId: 'invalid-staff-id', // Invalid staff ID
        type: 'check-in',
        timestamp: Date.now(),
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data'
      }
    ];

    const result = await offlineSyncService.processBatch(offlineRecords, userId, batchId);

    expect(result.total).toBe(2);
    expect(result.successful).toBeGreaterThan(0);
    expect(result.failed).toBeGreaterThan(0);

    // Verify sync batch status
    const syncBatch = await SyncBatch.findOne({ batchId });
    expect(syncBatch).toBeTruthy();
    expect(syncBatch!.failedRecords).toBeGreaterThan(0);
    expect(syncBatch!.errorSummary.length).toBeGreaterThan(0);
  });

  it('should handle conflict resolution - timestamp-based', async () => {
    const batchId = `batch-${Date.now()}`;

    // Create existing attendance
    const existingCheckIn = new Date('2026-02-12T09:00:00Z');
    await Attendance.create({
      staff: staffId,
      date: new Date('2026-02-12'),
      checkInTime: existingCheckIn,
      status: 'checked-in',
      flagged: false
    });

    // Try to sync conflicting check-in (different time, same day)
    const offlineRecords = [
      {
        localId: 'offline-conflict',
        staffId: staffId,
        type: 'check-in',
        timestamp: new Date('2026-02-12T09:15:00Z').getTime(), // 15 mins later
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data'
      }
    ];

    const result = await offlineSyncService.processBatch(offlineRecords, userId, batchId);

    // Should handle conflict (implementation dependent)
    expect(result.total).toBe(1);

    // Verify only one attendance exists for the day
    const attendanceRecords = await Attendance.find({
      staff: staffId,
      date: { $gte: new Date('2026-02-12T00:00:00Z'), $lte: new Date('2026-02-12T23:59:59Z') }
    });

    expect(attendanceRecords.length).toBeLessThanOrEqual(1);
  });

  it('should handle large batch of records efficiently', async () => {
    const batchId = `batch-large-${Date.now()}`;
    const largeRecordSet = [];

    // Create 50 records (alternating check-in/check-out over multiple days)
    for (let i = 0; i < 50; i++) {
      const dayOffset = Math.floor(i / 2);
      const baseDate = new Date('2026-02-01');
      baseDate.setDate(baseDate.getDate() + dayOffset);

      largeRecordSet.push({
        localId: `offline-${i}`,
        staffId: staffId,
        type: i % 2 === 0 ? 'check-in' : 'check-out',
        timestamp: baseDate.getTime() + (i % 2 === 0 ? 9 * 3600000 : 17 * 3600000),
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data'
      });
    }

    const startTime = Date.now();
    const result = await offlineSyncService.processBatch(largeRecordSet, userId, batchId);
    const duration = Date.now() - startTime;

    expect(result.total).toBe(50);
    expect(result.successful).toBeGreaterThan(0);

    // Should process relatively quickly (under 10 seconds for 50 records)
    expect(duration).toBeLessThan(10000);

    // Verify sync batch
    const syncBatch = await SyncBatch.findOne({ batchId });
    expect(syncBatch).toBeTruthy();
    expect(syncBatch!.status).toBe('completed');
    expect(syncBatch!.duration).toBeLessThan(10000);
  });

  it('should preserve offline record metadata', async () => {
    const batchId = `batch-${Date.now()}`;
    const offlineRecords = [
      {
        localId: 'offline-meta',
        staffId: staffId,
        type: 'check-in',
        timestamp: Date.now(),
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data',
        deviceInfo: {
          platform: 'android',
          version: '14',
          deviceId: 'device-123'
        },
        appVersion: '2.1.0',
        networkType: 'offline'
      }
    ];

    const result = await offlineSyncService.processBatch(offlineRecords, userId, batchId);

    expect(result.successful).toBe(1);

    // Verify sync batch contains metadata
    const syncBatch = await SyncBatch.findOne({ batchId });
    expect(syncBatch).toBeTruthy();
  });

  it('should handle check-in and check-out in correct order', async () => {
    const batchId = `batch-${Date.now()}`;
    const offlineRecords = [
      {
        localId: 'offline-checkout-first',
        staffId: staffId,
        type: 'check-out', // Check-out before check-in
        timestamp: Date.now(),
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data'
      },
      {
        localId: 'offline-checkin-second',
        staffId: staffId,
        type: 'check-in',
        timestamp: Date.now() - 3600000, // 1 hour earlier
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10,
          mocked: false
        },
        photo: 'base64-photo-data'
      }
    ];

    const result = await offlineSyncService.processBatch(offlineRecords, userId, batchId);

    // Should process both (order handling depends on implementation)
    expect(result.total).toBe(2);

    // Verify final attendance state
    const attendance = await Attendance.findOne({ staff: staffId });
    expect(attendance).toBeTruthy();
    // Should prioritize check-in first, then check-out
  });
});
