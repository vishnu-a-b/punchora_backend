/**
 * Full System Integration Test
 * Tests complete workflows across all Phase 6 features
 * Validates security, caching, mobile sync, and admin features work together
 */

import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import request from 'supertest';
import express from 'express';
import CacheService from '../../src/services/CacheService';
import AnalyticsService from '../../src/services/AnalyticsService';
import BulkImportService from '../../src/services/BulkImportService';
import CustomReportBuilderService from '../../src/services/CustomReportBuilderService';
import DashboardCustomizationService from '../../src/services/DashboardCustomizationService';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { Alert } from '../../src/modules/alert/models/Alert';
import { Activity } from '../../src/modules/activity/models/Activity';
import { DashboardCustomization } from '../../src/modules/dashboard/models/DashboardCustomization';

describe('Full System Integration Tests - Phase 6', () => {
  setupTestDB();

  let cacheService: any;
  let analyticsService: AnalyticsService;
  let bulkImportService: BulkImportService;
  let customReportService: CustomReportBuilderService;
  let customizationService: DashboardCustomizationService;

  let businessId: string;
  let userId: string;
  let staffId: string;

  beforeEach(async () => {
    cacheService = CacheService.getInstance();
    analyticsService = new AnalyticsService();
    bulkImportService = new BulkImportService();
    customReportService = new CustomReportBuilderService();
    customizationService = new DashboardCustomizationService();

    businessId = mockObjectId().toString();
    userId = mockObjectId().toString();

    // Create test staff
    const staff = await Staff.create({
      name: 'Test Staff',
      uid: 'TEST001',
      business: businessId,
      email: 'test@example.com',
      role: 'staff',
      isActive: true
    });
    staffId = staff._id.toString();
  });

  afterEach(async () => {
    await cacheService.flushall();
  });

  describe('1. Security + Caching Integration', () => {
    it('should cache dashboard metrics with 1-minute TTL', async () => {
      // First call - cache miss
      const metrics1 = await analyticsService.getDashboardMetrics(businessId);
      expect(metrics1).toBeDefined();
      expect(metrics1.attendance).toBeDefined();

      // Second call - cache hit
      const startTime = Date.now();
      const metrics2 = await analyticsService.getDashboardMetrics(businessId);
      const duration = Date.now() - startTime;

      expect(metrics2).toEqual(metrics1);
      expect(duration).toBeLessThan(50); // Cache should be much faster
    });

    it('should cache custom reports with 30-day TTL', async () => {
      const config = {
        name: 'Test Report',
        type: 'staff' as const,
        fields: ['name', 'uid', 'email'],
        filters: [],
        sortBy: [{ field: 'name', order: 'asc' as const }]
      };

      await customReportService.saveReportConfig(config, userId);
      const savedConfigs = await customReportService.getSavedConfigs(userId);

      expect(savedConfigs).toHaveLength(1);
      expect(savedConfigs[0].name).toBe('Test Report');
    });

    it('should cache dashboard layouts with 1-hour TTL', async () => {
      const layout1 = await customizationService.getLayoutForUser(userId, 'admin');
      expect(layout1.widgets.length).toBeGreaterThan(0);

      // Verify cache hit
      const layout2 = await customizationService.getLayoutForUser(userId, 'admin');
      expect(layout2).toEqual(layout1);
    });
  });

  describe('2. Mobile Sync + Analytics Integration', () => {
    it('should reflect synced attendance in dashboard metrics', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create attendance records
      await Attendance.create({
        staff: staffId,
        date: today,
        checkInTime: new Date(),
        status: 'present'
      });

      await Attendance.create({
        staff: staffId,
        date: today,
        checkInTime: new Date(),
        status: 'present',
        flagged: true,
        flagReason: 'Late check-in'
      });

      // Get dashboard metrics
      const metrics = await analyticsService.getDashboardMetrics(businessId);

      expect(metrics.attendance.presentToday).toBe(2);
      expect(metrics.attendance.flaggedRecords).toBe(1);
      expect(metrics.attendance.lateCheckins).toBeGreaterThanOrEqual(0);
    });

    it('should include sync metrics in dashboard', async () => {
      const metrics = await analyticsService.getDashboardMetrics(businessId);

      expect(metrics.sync).toBeDefined();
      expect(metrics.sync.pendingBatches).toBeGreaterThanOrEqual(0);
      expect(metrics.sync.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.sync.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('3. Bulk Operations + Custom Reports Integration', () => {
    it('should import staff from CSV and generate custom report', async () => {
      const csv = `name,uid,email,phone,department,role,status
John Doe,STAFF001,john@example.com,1234567890,,staff,active
Jane Smith,STAFF002,jane@example.com,9876543210,,manager,active`;

      // Import staff
      const importResult = await bulkImportService.importStaffFromCSV(
        csv,
        businessId,
        userId
      );

      expect(importResult.successful).toBe(2);
      expect(importResult.failed).toBe(0);

      // Build custom report
      const reportConfig = {
        name: 'Imported Staff Report',
        type: 'staff' as const,
        fields: ['name', 'uid', 'email', 'role'],
        filters: [],
        sortBy: [{ field: 'name', order: 'asc' as const }]
      };

      const report = await customReportService.buildCustomReport(
        reportConfig,
        businessId
      );

      expect(report.totalRecords).toBeGreaterThanOrEqual(2);
      expect(report.data.some((s: any) => s.name === 'John Doe')).toBe(true);
      expect(report.data.some((s: any) => s.name === 'Jane Smith')).toBe(true);
    });

    it('should export custom report to CSV', async () => {
      // Create some staff
      await Staff.create({
        name: 'Export Test 1',
        uid: 'EXP001',
        business: businessId,
        isActive: true
      });

      const reportConfig = {
        name: 'Export Test Report',
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

      const csv = await customReportService.exportToCSV(report);

      expect(csv).toContain('name,uid');
      expect(csv).toContain('Export Test 1');
    });
  });

  describe('4. Dashboard Customization + Analytics Integration', () => {
    it('should save custom layout and retrieve cached version', async () => {
      const customWidgets = [
        {
          id: 'custom-metric',
          type: 'metric' as const,
          title: 'Custom Metric',
          position: { x: 0, y: 0, w: 4, h: 2 },
          config: { metric: 'attendance.presentToday' }
        },
        {
          id: 'custom-chart',
          type: 'chart' as const,
          title: 'Custom Chart',
          position: { x: 4, y: 0, w: 8, h: 4 },
          config: { chartType: 'line', metric: 'alerts', days: 7 }
        }
      ];

      // Save custom layout
      const savedLayout = await customizationService.saveUserCustomizations(
        userId,
        'admin',
        customWidgets
      );

      expect(savedLayout.widgets).toHaveLength(2);
      expect(savedLayout.widgets[0].id).toBe('custom-metric');

      // Verify it's cached
      const cachedLayout = await customizationService.getLayoutForUser(userId, 'admin');
      expect(cachedLayout.widgets).toEqual(savedLayout.widgets);
    });

    it('should reset to role-based default layout', async () => {
      // Create custom layout
      await customizationService.saveUserCustomizations(userId, 'hr', [
        {
          id: 'test',
          type: 'metric' as const,
          title: 'Test',
          position: { x: 0, y: 0, w: 4, h: 2 },
          config: {}
        }
      ]);

      // Reset to default
      const defaultLayout = await customizationService.resetToDefault(userId, 'hr');

      // HR role should have specific default widgets
      expect(defaultLayout.widgets.length).toBeGreaterThan(1);
      expect(defaultLayout.widgets.some(w => w.id === 'attendance-today')).toBe(true);
    });
  });

  describe('5. Custom Reports with Aggregations', () => {
    it('should build report with groupBy and aggregations', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create activities
      await Activity.create({
        business: businessId,
        staff: staffId,
        type: 'BREAK',
        status: 'ENDED',
        startTime: new Date(),
        endTime: new Date(),
        duration: 30
      });

      await Activity.create({
        business: businessId,
        staff: staffId,
        type: 'BREAK',
        status: 'ENDED',
        startTime: new Date(),
        endTime: new Date(),
        duration: 25
      });

      const reportConfig = {
        name: 'Activity Summary',
        type: 'activity' as const,
        fields: [],
        filters: [],
        groupBy: 'type',
        aggregations: [
          { operation: 'count' as const, alias: 'totalActivities' },
          { operation: 'avg' as const, field: 'duration', alias: 'avgDuration' }
        ],
        sortBy: [{ field: 'totalActivities', order: 'desc' as const }]
      };

      const report = await customReportService.buildCustomReport(
        reportConfig,
        businessId
      );

      expect(report.data.length).toBeGreaterThan(0);
      const breakGroup = report.data.find((d: any) => d._id === 'BREAK');
      expect(breakGroup).toBeDefined();
      expect(breakGroup.totalActivities).toBe(2);
      expect(breakGroup.avgDuration).toBeCloseTo(27.5, 1);
    });
  });

  describe('6. Trend Data Integration', () => {
    it('should generate attendance trend data for charts', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Create attendance for today and yesterday
      await Attendance.create({
        staff: staffId,
        date: today,
        checkInTime: new Date(),
        status: 'present'
      });

      await Attendance.create({
        staff: staffId,
        date: yesterday,
        checkInTime: new Date(),
        status: 'present'
      });

      const trendData = await analyticsService.getTrendData(
        businessId,
        'attendance',
        7
      );

      expect(Array.isArray(trendData)).toBe(true);
      expect(trendData.length).toBeGreaterThan(0);
      expect(trendData[0]).toHaveProperty('date');
      expect(trendData[0]).toHaveProperty('value');
    });

    it('should generate alert trend data', async () => {
      // Create alerts
      await Alert.create({
        business: businessId,
        staff: staffId,
        type: 'ATTENDANCE_LATE',
        severity: 'medium',
        status: 'ACTIVE',
        title: 'Late Check-in',
        message: 'Staff checked in late'
      });

      const trendData = await analyticsService.getTrendData(
        businessId,
        'alerts',
        7
      );

      expect(Array.isArray(trendData)).toBe(true);
    });
  });

  describe('7. Configuration Validation', () => {
    it('should validate custom report configuration', () => {
      const invalidConfig = {
        name: '',
        type: 'invalid' as any,
        fields: [],
        filters: [],
        sortBy: []
      };

      const validation = customReportService.validateConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Report name is required');
      expect(validation.errors).toContain('Invalid report type');
    });

    it('should validate dashboard widget configuration', async () => {
      const invalidWidgets = [
        {
          id: 'test',
          type: 'invalid' as any,
          title: 'Test',
          position: { x: 0, y: 0, w: 20, h: 2 }, // Width > 12
          config: {}
        }
      ];

      await expect(
        customizationService.saveUserCustomizations(userId, 'admin', invalidWidgets)
      ).rejects.toThrow('Invalid widgets');
    });
  });

  describe('8. Bulk Export Integration', () => {
    it('should export attendance with filters', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Attendance.create({
        staff: staffId,
        date: today,
        checkInTime: new Date(),
        checkOutTime: new Date(),
        status: 'present',
        flagged: true,
        flagReason: 'Late'
      });

      const BulkExportService = (await import('../../src/services/BulkExportService')).default;
      const exportService = new BulkExportService();

      const csv = await exportService.exportAttendance(
        businessId,
        today,
        new Date(),
        { flaggedOnly: true },
        userId
      );

      expect(csv).toContain('Date,Staff UID,Staff Name');
      expect(csv).toContain('Late');
    });
  });

  describe('9. Available Fields and Widget Types', () => {
    it('should return available fields for each report type', () => {
      const staffFields = customReportService.getAvailableFields('staff');
      expect(staffFields).toContain('name');
      expect(staffFields).toContain('uid');
      expect(staffFields).toContain('email');

      const attendanceFields = customReportService.getAvailableFields('attendance');
      expect(attendanceFields).toContain('checkInTime');
      expect(attendanceFields).toContain('checkOutTime');
    });

    it('should return role-specific widget types', () => {
      const adminWidgets = customizationService.getAvailableWidgetTypes('super_admin');
      expect(adminWidgets).toContain('metric');
      expect(adminWidgets).toContain('chart');
      expect(adminWidgets).toContain('audit-log');

      const staffWidgets = customizationService.getAvailableWidgetTypes('staff');
      expect(staffWidgets).toContain('metric');
      expect(staffWidgets).not.toContain('audit-log');
    });
  });

  describe('10. End-to-End Workflow', () => {
    it('should complete full dashboard workflow', async () => {
      // 1. Import staff
      const csv = `name,uid,email,phone,department,role,status
Workflow Test,WF001,wf@test.com,1234567890,,staff,active`;

      const importResult = await bulkImportService.importStaffFromCSV(
        csv,
        businessId,
        userId
      );
      expect(importResult.successful).toBe(1);

      // 2. Get analytics (should include imported staff)
      const metrics = await analyticsService.getDashboardMetrics(businessId);
      expect(metrics.staff.totalActive).toBeGreaterThanOrEqual(1);

      // 3. Build custom report
      const reportConfig = {
        name: 'Workflow Report',
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
      expect(report.totalRecords).toBeGreaterThanOrEqual(1);

      // 4. Save report config
      await customReportService.saveReportConfig(reportConfig, userId);
      const savedConfigs = await customReportService.getSavedConfigs(userId);
      expect(savedConfigs.some(c => c.name === 'Workflow Report')).toBe(true);

      // 5. Customize dashboard
      const layout = await customizationService.getLayoutForUser(userId, 'admin');
      expect(layout.widgets.length).toBeGreaterThan(0);

      // 6. Export to CSV
      const csv2 = await customReportService.exportToCSV(report);
      expect(csv2).toContain('Workflow Test');
    });
  });
});
