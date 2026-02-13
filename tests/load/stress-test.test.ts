/**
 * Stress Test Suite
 * Tests system behavior under extreme load
 * Phase 6: Week 4 - Load Testing
 */

import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import AnalyticsService from '../../src/services/AnalyticsService';
import CacheService from '../../src/services/CacheService';
import CustomReportBuilderService from '../../src/services/CustomReportBuilderService';

describe('Stress Tests - Extreme Load', () => {
  setupTestDB();

  let analyticsService: AnalyticsService;
  let cacheService: any;
  let customReportService: CustomReportBuilderService;

  let businessId: string;

  beforeAll(async () => {
    analyticsService = new AnalyticsService();
    cacheService = CacheService.getInstance();
    customReportService = new CustomReportBuilderService();

    businessId = mockObjectId().toString();
  });

  afterEach(async () => {
    await cacheService.flushall();
  });

  describe('1. Concurrent Dashboard Analytics Requests', () => {
    it('should handle 1000 concurrent dashboard analytics requests', async () => {
      // Create test data
      const staff = await Staff.create({
        name: 'Stress Test Staff',
        uid: 'STRESS001',
        business: businessId,
        isActive: true
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create attendance records
      await Attendance.create({
        staff: staff._id,
        date: today,
        checkInTime: new Date(),
        status: 'present'
      });

      const startTime = Date.now();
      const concurrentRequests = 1000;

      // Execute concurrent requests
      const promises = Array(concurrentRequests).fill(0).map(() =>
        analyticsService.getDashboardMetrics(businessId)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Assertions
      expect(results.length).toBe(concurrentRequests);
      expect(duration).toBeLessThan(10000); // Should complete in <10s
      expect(results[0].attendance).toBeDefined();

      console.log(`   ✅ 1000 concurrent requests completed in ${duration}ms`);
      console.log(`   ⏱️  Avg response time: ${(duration / concurrentRequests).toFixed(2)}ms`);
    }, 30000); // 30s timeout
  });

  describe('2. Large Dataset Processing', () => {
    it('should generate custom report for 10,000 staff records', async () => {
      // Create 10,000 staff records
      const staffData = Array(10000).fill(0).map((_, i) => ({
        name: `Staff ${i}`,
        uid: `UID${i.toString().padStart(5, '0')}`,
        business: businessId,
        email: `staff${i}@test.com`,
        isActive: i % 10 !== 0 // 90% active
      }));

      const startInsert = Date.now();
      await Staff.insertMany(staffData);
      const insertDuration = Date.now() - startInsert;

      console.log(`   ✅ Inserted 10,000 records in ${insertDuration}ms`);

      // Generate report
      const reportConfig = {
        name: 'Large Dataset Report',
        type: 'staff' as const,
        fields: ['name', 'uid', 'email', 'isActive'],
        filters: [
          { field: 'business', operator: 'eq' as const, value: businessId }
        ],
        sortBy: [{ field: 'name', order: 'asc' as const }]
      };

      const startReport = Date.now();
      const report = await customReportService.buildCustomReport(
        reportConfig,
        businessId
      );
      const reportDuration = Date.now() - startReport;

      expect(report.totalRecords).toBe(10000);
      expect(reportDuration).toBeLessThan(5000); // <5s for 10k records

      console.log(`   ✅ Generated report in ${reportDuration}ms`);
      console.log(`   📊 Records processed: ${report.totalRecords}`);
    }, 60000); // 60s timeout

    it('should export 10,000 records to CSV efficiently', async () => {
      const reportConfig = {
        name: 'Export Test',
        type: 'staff' as const,
        fields: ['name', 'uid'],
        filters: [
          { field: 'business', operator: 'eq' as const, value: businessId }
        ],
        sortBy: [{ field: 'name', order: 'asc' as const }]
      };

      const report = await customReportService.buildCustomReport(
        reportConfig,
        businessId
      );

      const startExport = Date.now();
      const csv = await customReportService.exportToCSV(report);
      const exportDuration = Date.now() - startExport;

      expect(csv.split('\n').length).toBeGreaterThan(10000);
      expect(exportDuration).toBeLessThan(2000); // <2s for CSV export

      console.log(`   ✅ Exported ${report.totalRecords} records to CSV in ${exportDuration}ms`);
    }, 30000);
  });

  describe('3. Memory Leak Detection', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 1000 operations
      for (let i = 0; i < 1000; i++) {
        await analyticsService.getDashboardMetrics(businessId);

        // Clear cache periodically
        if (i % 100 === 0) {
          await cacheService.flushall();
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be < 50MB for 1000 operations
      expect(memoryIncreaseMB).toBeLessThan(50);

      console.log(`   ✅ Memory increase: ${memoryIncreaseMB.toFixed(2)}MB (limit: 50MB)`);
    }, 60000);
  });

  describe('4. Cache Performance Under Load', () => {
    it('should maintain high cache hit rate under load', async () => {
      const requests = 5000;
      const cacheHits: number[] = [];

      for (let i = 0; i < requests; i++) {
        await analyticsService.getDashboardMetrics(businessId);

        // Check cache stats every 100 requests
        if (i > 0 && i % 100 === 0) {
          const info = await cacheService.info('stats');
          const lines = info.split('\r\n');
          const stats: any = {};

          for (const line of lines) {
            if (line.includes(':')) {
              const [key, value] = line.split(':');
              stats[key] = isNaN(Number(value)) ? value : Number(value);
            }
          }

          const hits = stats.keyspace_hits || 0;
          const misses = stats.keyspace_misses || 0;
          const total = hits + misses;
          const hitRate = total > 0 ? (hits / total) * 100 : 0;

          cacheHits.push(hitRate);
        }
      }

      const avgHitRate = cacheHits.reduce((a, b) => a + b, 0) / cacheHits.length;
      expect(avgHitRate).toBeGreaterThan(80);

      console.log(`   ✅ Average cache hit rate: ${avgHitRate.toFixed(2)}% (target: >80%)`);
    }, 60000);
  });

  describe('5. Database Connection Pool Stress', () => {
    it('should handle rapid sequential database operations', async () => {
      const operations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < operations; i++) {
        await Staff.countDocuments({ business: businessId });
      }

      const duration = Date.now() - startTime;
      const opsPerSecond = (operations / duration) * 1000;

      expect(duration).toBeLessThan(10000); // <10s for 1000 ops
      expect(opsPerSecond).toBeGreaterThan(50); // >50 ops/sec

      console.log(`   ✅ ${operations} operations in ${duration}ms`);
      console.log(`   ⚡ Throughput: ${opsPerSecond.toFixed(2)} ops/sec`);
    }, 30000);
  });

  describe('6. Aggregation Pipeline Stress', () => {
    it('should handle complex aggregation with large dataset', async () => {
      // Use existing 10k staff records
      const reportConfig = {
        name: 'Complex Aggregation',
        type: 'staff' as const,
        fields: [],
        filters: [
          { field: 'business', operator: 'eq' as const, value: businessId }
        ],
        groupBy: 'isActive',
        aggregations: [
          { operation: 'count' as const, alias: 'total' }
        ],
        sortBy: [{ field: 'total', order: 'desc' as const }]
      };

      const startTime = Date.now();
      const report = await customReportService.buildCustomReport(
        reportConfig,
        businessId
      );
      const duration = Date.now() - startTime;

      expect(report.data.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(3000); // <3s for aggregation

      console.log(`   ✅ Aggregation completed in ${duration}ms`);
      console.log(`   📊 Groups: ${report.data.length}`);
    }, 30000);
  });

  describe('7. Parallel Processing Efficiency', () => {
    it('should efficiently process 100 parallel custom reports', async () => {
      const reportConfigs = Array(100).fill(0).map((_, i) => ({
        name: `Report ${i}`,
        type: 'staff' as const,
        fields: ['name', 'uid'],
        filters: [
          { field: 'business', operator: 'eq' as const, value: businessId }
        ],
        sortBy: [{ field: 'name', order: 'asc' as const }],
        limit: 100
      }));

      const startTime = Date.now();

      const reports = await Promise.all(
        reportConfigs.map(config =>
          customReportService.buildCustomReport(config, businessId)
        )
      );

      const duration = Date.now() - startTime;

      expect(reports.length).toBe(100);
      expect(duration).toBeLessThan(15000); // <15s for 100 parallel reports

      console.log(`   ✅ 100 parallel reports in ${duration}ms`);
      console.log(`   ⏱️  Avg per report: ${(duration / 100).toFixed(2)}ms`);
    }, 30000);
  });

  describe('8. Stress Recovery', () => {
    it('should recover gracefully after cache flush under load', async () => {
      // Generate load
      const promises1 = Array(100).fill(0).map(() =>
        analyticsService.getDashboardMetrics(businessId)
      );

      await Promise.all(promises1);

      // Flush cache mid-load
      await cacheService.flushall();

      // Continue generating load
      const startTime = Date.now();
      const promises2 = Array(100).fill(0).map(() =>
        analyticsService.getDashboardMetrics(businessId)
      );

      const results = await Promise.all(promises2);
      const duration = Date.now() - startTime;

      expect(results.length).toBe(100);
      expect(duration).toBeLessThan(5000); // Should rebuild cache quickly

      console.log(`   ✅ Recovered from cache flush in ${duration}ms`);
    }, 30000);
  });

  describe('9. Real-World Scenario Simulation', () => {
    it('should handle typical production load pattern', async () => {
      const startTime = Date.now();

      // Simulate 100 users checking dashboard
      const dashboardPromises = Array(100).fill(0).map(() =>
        analyticsService.getDashboardMetrics(businessId)
      );

      // Simulate 20 users generating reports
      const reportPromises = Array(20).fill(0).map(() =>
        customReportService.buildCustomReport({
          name: 'Production Report',
          type: 'staff' as const,
          fields: ['name', 'uid'],
          filters: [
            { field: 'business', operator: 'eq' as const, value: businessId }
          ],
          sortBy: [{ field: 'name', order: 'asc' as const }]
        }, businessId)
      );

      // Simulate 50 database queries
      const queryPromises = Array(50).fill(0).map(() =>
        Staff.countDocuments({ business: businessId })
      );

      // Execute all concurrently
      await Promise.all([
        ...dashboardPromises,
        ...reportPromises,
        ...queryPromises
      ]);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000); // <10s for mixed load

      console.log(`   ✅ Mixed workload (170 operations) completed in ${duration}ms`);
      console.log(`   📊 100 dashboard + 20 reports + 50 queries`);
    }, 30000);
  });

  describe('10. Resource Cleanup', () => {
    it('should properly clean up resources after stress', async () => {
      // Get initial connection count
      const initialConnections = (await (Staff.db.db as any).admin().serverStatus()).connections.current;

      // Perform operations
      const promises = Array(500).fill(0).map(() =>
        analyticsService.getDashboardMetrics(businessId)
      );

      await Promise.all(promises);

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalConnections = (await (Staff.db.db as any).admin().serverStatus()).connections.current;

      // Connection count should not grow significantly
      const connectionGrowth = finalConnections - initialConnections;
      expect(connectionGrowth).toBeLessThan(10);

      console.log(`   ✅ Connection growth: ${connectionGrowth} (limit: <10)`);
    }, 30000);
  });
});
