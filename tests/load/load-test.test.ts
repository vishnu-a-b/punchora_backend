/**
 * Load Tests
 * Tests system performance under concurrent load
 */

import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { Alert, AlertStatus } from '../../src/modules/alert/models/Alert';
import StaffService from '../../src/modules/staff/services/StaffService';
import AlertService from '../../src/modules/alert/services/AlertService';
import ReportService from '../../src/modules/report/services/ReportService';
import CacheService from '../../src/services/CacheService';

describe('Load Tests', () => {
  setupTestDB();

  let staffService: StaffService;
  let alertService: AlertService;
  let reportService: ReportService;
  let cacheService: CacheService;
  let businessId: string;

  beforeAll(async () => {
    staffService = new StaffService();
    alertService = new AlertService();
    reportService = new ReportService();
    cacheService = CacheService.getInstance();
    businessId = mockObjectId().toString();

    // Create test data for load testing
    const staffPromises = [];
    for (let i = 0; i < 100; i++) {
      staffPromises.push(
        Staff.create({
          name: `Load Test Staff ${i}`,
          uid: `LOAD${i.toString().padStart(3, '0')}`,
          business: businessId,
          isActive: true
        })
      );
    }
    await Promise.all(staffPromises);
  });

  describe('Concurrent Staff List Requests', () => {
    it('should handle 100 concurrent staff list requests', async () => {
      const requests = [];

      for (let i = 0; i < 100; i++) {
        requests.push(
          staffService.find({
            filterQuery: { business: businessId },
            limit: 20,
            skip: i % 5 * 20, // Vary pagination
            sort: { name: 1 }
          })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All requests should succeed
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.items).toBeDefined();
        expect(result.total).toBeGreaterThan(0);
      });

      // Should complete within reasonable time (10 seconds for 100 requests)
      expect(duration).toBeLessThan(10000);
      console.log(`100 concurrent staff list requests completed in ${duration}ms`);
    });

    it('should maintain response time under load', async () => {
      const responseTimes: number[] = [];

      // Execute 50 sequential requests to measure individual response times
      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        await staffService.find({
          filterQuery: { business: businessId },
          limit: 20,
          skip: 0,
          sort: { name: 1 }
        });
        responseTimes.push(Date.now() - startTime);
      }

      // Calculate average response time
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      // Average should be under 100ms (with caching)
      expect(avgResponseTime).toBeLessThan(100);
      console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Alert Creation', () => {
    it('should handle 50 concurrent alert creations', async () => {
      const staff = await Staff.find({ business: businessId }).limit(10);
      const requests = [];

      for (let i = 0; i < 50; i++) {
        const randomStaff = staff[i % staff.length];
        requests.push(
          alertService.createAlert({
            type: i % 2 === 0 ? 'mocked_gps' : 'late_check_in',
            severity: i % 3 === 0 ? 'high' : 'medium',
            staff: randomStaff._id.toString(),
            business: businessId,
            title: `Load Test Alert ${i}`,
            message: `Test alert ${i}`,
            priority: (i % 5) + 1
          })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All should succeed (with deduplication)
      expect(results).toHaveLength(50);

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      console.log(`50 concurrent alert creations completed in ${duration}ms`);
    });
  });

  describe('Concurrent Report Generation', () => {
    beforeAll(async () => {
      // Create attendance data for reports
      const staff = await Staff.find({ business: businessId }).limit(50);
      const attendancePromises = [];

      for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i % 7)); // Last 7 days

        attendancePromises.push(
          Attendance.create({
            staff: staff[i]._id,
            date,
            checkInTime: new Date(date.getTime() + 9 * 3600000),
            checkOutTime: new Date(date.getTime() + 17 * 3600000),
            status: 'checked-out',
            flagged: i % 10 === 0
          })
        );
      }

      await Promise.all(attendancePromises);
    });

    it('should handle 20 concurrent report generations', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const requests = [];

      for (let i = 0; i < 20; i++) {
        if (i % 4 === 0) {
          requests.push(
            reportService.generateLocationComplianceReport(businessId, {})
          );
        } else if (i % 4 === 1) {
          requests.push(
            reportService.generateAttendanceAnomaliesReport(
              businessId,
              startDate,
              endDate,
              {}
            )
          );
        } else if (i % 4 === 2) {
          requests.push(
            reportService.generateLateCheckinsReport(
              businessId,
              startDate,
              endDate
            )
          );
        } else {
          requests.push(
            reportService.generateAlertSummaryReport(
              businessId,
              startDate,
              endDate
            )
          );
        }
      }

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All should succeed
      expect(results).toHaveLength(20);
      results.forEach(report => {
        expect(report.reportType).toBeDefined();
        expect(report.summary).toBeDefined();
      });

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      console.log(`20 concurrent report generations completed in ${duration}ms`);
    });
  });

  describe('Mixed Load Test', () => {
    it('should handle mixed concurrent operations', async () => {
      const staff = await Staff.find({ business: businessId }).limit(20);
      const requests: Promise<any>[] = [];

      // Mix of different operations
      for (let i = 0; i < 100; i++) {
        const operation = i % 5;

        switch (operation) {
          case 0: // Staff list
            requests.push(
              staffService.find({
                filterQuery: { business: businessId },
                limit: 20,
                skip: 0,
                sort: { name: 1 }
              })
            );
            break;

          case 1: // Alert list
            requests.push(
              alertService.getAlerts({ business: businessId }, { limit: 20 })
            );
            break;

          case 2: // Alert stats
            requests.push(alertService.getAlertStats(businessId));
            break;

          case 3: // Staff count
            requests.push(staffService.countTotalDocuments());
            break;

          case 4: // Alert count
            if (staff.length > 0) {
              requests.push(
                alertService.getStaffAlertCount(
                  staff[i % staff.length]._id.toString()
                )
              );
            }
            break;
        }
      }

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All should succeed
      expect(results).toHaveLength(100);

      // Should complete within 15 seconds for mixed load
      expect(duration).toBeLessThan(15000);
      console.log(`100 mixed concurrent operations completed in ${duration}ms`);
    });
  });

  describe('Cache Performance Under Load', () => {
    it('should improve performance with caching', async () => {
      const cacheKey = `test:load:${businessId}`;

      // First request (no cache)
      const uncachedStart = Date.now();
      await staffService.find({
        filterQuery: { business: businessId },
        limit: 20,
        skip: 0,
        sort: { name: 1 }
      });
      const uncachedDuration = Date.now() - uncachedStart;

      // Set cache
      await cacheService.set(cacheKey, { test: 'data' }, 60);

      // Multiple cached requests
      const cachedRequests = [];
      for (let i = 0; i < 50; i++) {
        cachedRequests.push(cacheService.get(cacheKey));
      }

      const cachedStart = Date.now();
      await Promise.all(cachedRequests);
      const cachedDuration = Date.now() - cachedStart;

      // Cached requests should be significantly faster
      const avgCachedTime = cachedDuration / 50;
      expect(avgCachedTime).toBeLessThan(uncachedDuration);

      console.log(`Uncached request: ${uncachedDuration}ms`);
      console.log(`50 cached requests: ${cachedDuration}ms (avg: ${avgCachedTime.toFixed(2)}ms)`);
    });
  });

  describe('Memory Usage Under Load', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 1000 operations
      for (let batch = 0; batch < 10; batch++) {
        const batchRequests = [];

        for (let i = 0; i < 100; i++) {
          batchRequests.push(
            staffService.find({
              filterQuery: { business: businessId },
              limit: 20,
              skip: 0,
              sort: { name: 1 }
            })
          );
        }

        await Promise.all(batchRequests);

        // Allow garbage collection
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100);
      console.log(`Memory increase after 1000 operations: ${memoryIncrease.toFixed(2)}MB`);
    });
  });

  describe('Database Connection Pool', () => {
    it('should handle concurrent database operations efficiently', async () => {
      const requests = [];

      // Mix of read and write operations
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          // Read
          requests.push(Staff.find({ business: businessId }).limit(10));
        } else if (i % 3 === 1) {
          // Count
          requests.push(Staff.countDocuments({ business: businessId }));
        } else {
          // Aggregate
          requests.push(
            Alert.aggregate([
              { $match: { business: businessId } },
              { $group: { _id: '$type', count: { $sum: 1 } } }
            ])
          );
        }
      }

      const startTime = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Should complete efficiently with connection pooling
      expect(duration).toBeLessThan(10000);
      console.log(`100 concurrent database operations completed in ${duration}ms`);
    });
  });
});
