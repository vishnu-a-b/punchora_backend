/**
 * Performance Benchmark Tests
 * Tests API performance and response times
 */

import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { Activity } from '../../src/modules/activity/models/Activity';
import StaffService from '../../src/modules/staff/services/StaffService';
import ActivityService from '../../src/modules/activity/services/ActivityService';

describe('Performance Benchmarks', () => {
  setupTestDB();

  let staffService: StaffService;
  let activityService: ActivityService;
  let businessId: string;

  beforeAll(async () => {
    staffService = new StaffService();
    activityService = new ActivityService();
    businessId = mockObjectId().toString();

    // Create large dataset for performance testing
    const staffPromises = [];
    const departmentId = mockObjectId();

    for (let i = 0; i < 100; i++) {
      staffPromises.push(
        Staff.create({
          name: `Staff Member ${i}`,
          uid: `STAFF${i.toString().padStart(3, '0')}`,
          email: `staff${i}@example.com`,
          business: businessId,
          department: departmentId,
          isActive: true,
          role: i % 10 === 0 ? 'manager' : 'staff'
        })
      );
    }

    await Promise.all(staffPromises);
  });

  describe('Staff List Endpoint Performance', () => {
    it('should return staff list within 100ms (first call)', async () => {
      const startTime = Date.now();

      await staffService.find({
        filterQuery: { business: businessId },
        limit: 20,
        skip: 0,
        sort: { name: 1 }
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle pagination efficiently', async () => {
      const startTime = Date.now();

      // Fetch multiple pages
      await Promise.all([
        staffService.find({
          filterQuery: { business: businessId },
          limit: 20,
          skip: 0
        }),
        staffService.find({
          filterQuery: { business: businessId },
          limit: 20,
          skip: 20
        }),
        staffService.find({
          filterQuery: { business: businessId },
          limit: 20,
          skip: 40
        })
      ]);

      const duration = Date.now() - startTime;

      // Parallel queries should complete in reasonable time
      expect(duration).toBeLessThan(300);
    });

    it('should handle filtered queries efficiently', async () => {
      const startTime = Date.now();

      await staffService.find({
        filterQuery: {
          business: businessId,
          isActive: true,
          role: 'staff'
        },
        limit: 50,
        skip: 0
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Activity Tracking Performance', () => {
    let staffIds: string[];

    beforeAll(async () => {
      const staff = await Staff.find({ business: businessId }).limit(10);
      staffIds = staff.map(s => s._id.toString());

      // Create activities for performance testing
      const activityPromises = [];
      for (let i = 0; i < 50; i++) {
        const staffId = staffIds[i % staffIds.length];
        activityPromises.push(
          Activity.create({
            staff: staffId,
            business: businessId,
            type: ['tea-break', 'lunch-break', 'washroom'][i % 3],
            status: i % 2 === 0 ? 'started' : 'ended',
            startTime: new Date(Date.now() - i * 60000),
            endTime: i % 2 === 0 ? null : new Date(Date.now() - i * 60000 + 900000),
            duration: i % 2 === 0 ? undefined : 15
          })
        );
      }
      await Promise.all(activityPromises);
    });

    it('should retrieve staff activities within 50ms', async () => {
      const staffId = staffIds[0];

      const startTime = Date.now();

      await activityService.getStaffActivities(staffId, {
        limit: 20,
        skip: 0
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('should handle activity statistics efficiently', async () => {
      const staffId = staffIds[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();

      const startTime = Date.now();

      await activityService.getActivityStats(staffId, startDate, endDate);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Bulk Data Operations', () => {
    it('should handle bulk staff creation efficiently', async () => {
      const staffData = Array.from({ length: 50 }, (_, i) => ({
        name: `Bulk Staff ${i}`,
        uid: `BULK${i}`,
        business: businessId,
        department: mockObjectId(),
        isActive: true
      }));

      const startTime = Date.now();

      await Staff.insertMany(staffData);

      const duration = Date.now() - startTime;

      // Bulk insert should be fast
      expect(duration).toBeLessThan(200);
    });

    it('should handle concurrent database reads efficiently', async () => {
      const startTime = Date.now();

      // Simulate concurrent reads from different services
      await Promise.all([
        staffService.find({ filterQuery: { business: businessId }, limit: 20, skip: 0 }),
        staffService.countTotalDocuments(),
        Staff.find({ business: businessId, isActive: true }).limit(10),
        Staff.countDocuments({ business: businessId })
      ]);

      const duration = Date.now() - startTime;

      // Concurrent reads should leverage connection pooling
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Query Optimization', () => {
    it('should benefit from indexes on frequently queried fields', async () => {
      // Test query performance on indexed field (business + isActive)
      const startTime = Date.now();

      await Staff.find({
        business: businessId,
        isActive: true
      }).limit(50);

      const duration = Date.now() - startTime;

      // With proper indexing, this should be very fast
      expect(duration).toBeLessThan(50);
    });

    it('should handle complex filters efficiently', async () => {
      const startTime = Date.now();

      await staffService.find({
        filterQuery: {
          business: businessId,
          isActive: true,
          role: 'staff',
          name: { $regex: 'Staff Member', $options: 'i' }
        },
        limit: 20,
        skip: 0,
        sort: { name: 1 }
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Database Write Performance', () => {
    it('should handle single document updates efficiently', async () => {
      const staff = await Staff.findOne({ business: businessId });

      const startTime = Date.now();

      await staffService.update({
        id: staff!._id.toString(),
        staff: { name: 'Updated Name' }
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('should handle document creation with validation efficiently', async () => {
      const startTime = Date.now();

      await staffService.create({
        name: 'Performance Test Staff',
        uid: 'PERF001',
        email: 'perf@example.com',
        business: businessId,
        department: mockObjectId(),
        isActive: true
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory when processing large result sets', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Process large result set in batches
      for (let i = 0; i < 5; i++) {
        await staffService.find({
          filterQuery: { business: businessId },
          limit: 100,
          skip: i * 100
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50);
    });
  });
});
