/**
 * Integration Tests for Offline Sync API
 * Tests the full HTTP request/response cycle for offline attendance sync
 */

import request from 'supertest';
import express from 'express';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { OfflineAttendanceController } from '../../src/modules/offlineFaceRecognition/controllers/OfflineAttendanceController';
import { Router } from 'express';

describe('Offline Sync API Integration', () => {
  setupTestDB();

  let app: express.Application;
  let authToken: string;
  let userId: string;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json({ limit: '50mb' }));

    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = {
        _id: userId,
        role: 'staff'
      };
      next();
    });

    // Setup routes
    const offlineAttendanceRouter = Router();
    const controller = new OfflineAttendanceController();

    offlineAttendanceRouter.post('/sync', controller.syncAttendance);
    offlineAttendanceRouter.get('/sync-status/:batchId', controller.getSyncBatchStatus);
    offlineAttendanceRouter.get('/sync-history', controller.getUserSyncHistory);

    app.use('/api/offline', offlineAttendanceRouter);
  });

  beforeEach(() => {
    userId = mockObjectId().toString();
    authToken = 'mock-jwt-token';
  });

  describe('POST /api/offline/sync', () => {
    it('should successfully sync offline attendance records', async () => {
      const syncPayload = {
        records: [
          {
            localId: 'local-test-1',
            staffId: mockObjectId().toString(),
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
              platform: 'ios',
              version: '17.0'
            }
          }
        ]
      };

      const response = await request(app)
        .post('/api/offline/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.batchId).toBeTruthy();
      expect(response.body.summary.total).toBe(1);
      expect(response.body.summary.successful).toBe(1);
      expect(response.body.summary.failed).toBe(0);
    });

    it('should return validation errors for invalid records', async () => {
      const invalidPayload = {
        records: [
          {
            localId: 'invalid-1',
            staffId: 'not-a-valid-object-id',
            type: 'check-in',
            timestamp: 'invalid-timestamp', // Should be number
            location: {
              latitude: 'invalid', // Should be number
              longitude: 77.5946
            }
          }
        ]
      };

      const response = await request(app)
        .post('/api/offline/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeTruthy();
      expect(response.body.validationErrors.length).toBeGreaterThan(0);
    });

    it('should handle GPS spoofing and flag records', async () => {
      const spoofedPayload = {
        records: [
          {
            localId: 'spoofed-1',
            staffId: mockObjectId().toString(),
            type: 'check-in',
            timestamp: Date.now(),
            location: {
              latitude: 12.9716,
              longitude: 77.5946,
              accuracy: 10,
              mocked: true // GPS spoofing
            },
            photo: 'base64-photo-data',
            deviceInfo: {
              platform: 'android',
              version: '14'
            }
          }
        ]
      };

      const response = await request(app)
        .post('/api/offline/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(spoofedPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      // GPS spoofing should be processed but flagged
      expect(response.body.results[0].warnings).toContain('GPS spoofing detected');
    });

    it('should handle batch sync with multiple records', async () => {
      const batchPayload = {
        records: Array.from({ length: 5 }, (_, i) => ({
          localId: `batch-record-${i}`,
          staffId: mockObjectId().toString(),
          type: i % 2 === 0 ? 'check-in' : 'check-out',
          timestamp: Date.now() + i * 1000,
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 10,
            mocked: false
          },
          photo: `photo-${i}`,
          deviceInfo: {
            platform: 'ios',
            version: '17.0'
          }
        }))
      };

      const response = await request(app)
        .post('/api/offline/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.summary.total).toBe(5);
      expect(response.body.results).toHaveLength(5);
    });

    it('should prevent duplicate submissions with same idempotency key', async () => {
      const payload = {
        records: [
          {
            localId: 'duplicate-test',
            staffId: mockObjectId().toString(),
            type: 'check-in',
            timestamp: 1642694400000,
            location: {
              latitude: 12.9716,
              longitude: 77.5946,
              accuracy: 10,
              mocked: false
            },
            photo: 'photo-data'
          }
        ]
      };

      // First submission
      await request(app)
        .post('/api/offline/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(200);

      // Second submission (duplicate)
      const response = await request(app)
        .post('/api/offline/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(200);

      expect(response.body.summary.failed).toBe(1);
      expect(response.body.results[0].error).toContain('duplicate');
    });

    it('should require authentication', async () => {
      // Create app without auth middleware
      const unauthApp = express();
      unauthApp.use(express.json());

      const offlineRouter = Router();
      const controller = new OfflineAttendanceController();
      offlineRouter.post('/sync', controller.syncAttendance);
      unauthApp.use('/api/offline', offlineRouter);

      const payload = {
        records: [
          {
            localId: 'auth-test',
            staffId: mockObjectId().toString(),
            type: 'check-in',
            timestamp: Date.now(),
            location: { latitude: 12.9716, longitude: 77.5946 }
          }
        ]
      };

      const response = await request(unauthApp)
        .post('/api/offline/sync')
        .send(payload)
        .expect(400);

      expect(response.body.error).toContain('authentication');
    });
  });

  describe('GET /api/offline/sync-status/:batchId', () => {
    it('should return batch status for existing batch', async () => {
      // First create a sync batch
      const syncPayload = {
        records: [
          {
            localId: 'status-test',
            staffId: mockObjectId().toString(),
            type: 'check-in',
            timestamp: Date.now(),
            location: { latitude: 12.9716, longitude: 77.5946, accuracy: 10, mocked: false },
            photo: 'photo-data'
          }
        ]
      };

      const syncResponse = await request(app)
        .post('/api/offline/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncPayload);

      const batchId = syncResponse.body.batchId;

      // Now check status
      const statusResponse = await request(app)
        .get(`/api/offline/sync-status/${batchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.batchId).toBe(batchId);
      expect(statusResponse.body.data.status).toBeTruthy();
    });

    it('should return 404 for non-existent batch', async () => {
      const response = await request(app)
        .get('/api/offline/sync-status/non-existent-batch-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/offline/sync-history', () => {
    it('should return user sync history', async () => {
      // Create multiple sync batches
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/offline/sync')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            records: [
              {
                localId: `history-${i}`,
                staffId: mockObjectId().toString(),
                type: 'check-in',
                timestamp: Date.now() + i * 1000,
                location: { latitude: 12.9716, longitude: 77.5946, accuracy: 10, mocked: false }
              }
            ]
          });
      }

      const response = await request(app)
        .get('/api/offline/sync-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeTruthy();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should respect limit query parameter', async () => {
      const response = await request(app)
        .get('/api/offline/sync-history?limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });
});
