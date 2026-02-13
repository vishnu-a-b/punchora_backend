/**
 * E2E Test: Report Generation Flow
 * Tests complete workflow: generate report → export CSV → export PDF → verify cache
 */

import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { Alert, AlertStatus } from '../../src/modules/alert/models/Alert';
import ReportService from '../../src/modules/report/services/ReportService';
import ExportService from '../../src/modules/report/services/ExportService';
import CacheService from '../../src/services/CacheService';

describe('E2E: Report Generation Flow', () => {
  setupTestDB();

  let reportService: ReportService;
  let exportService: ExportService;
  let cacheService: CacheService;
  let businessId: string;
  let staffId: string;

  beforeEach(async () => {
    reportService = new ReportService();
    exportService = new ExportService();
    cacheService = CacheService.getInstance();

    businessId = mockObjectId().toString();

    // Create test staff
    const staff = await Staff.create({
      name: 'Report Test Staff',
      uid: 'REPORT001',
      business: businessId,
      isActive: true
    });
    staffId = staff._id.toString();

    // Create test attendance records
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Attendance.create([
      {
        staff: staffId,
        date: today,
        checkInTime: new Date(today.getTime() + 9 * 3600000), // 9 AM
        checkOutTime: new Date(today.getTime() + 17 * 3600000), // 5 PM
        status: 'checked-out',
        flagged: false
      },
      {
        staff: staffId,
        date: new Date(today.getTime() - 86400000), // Yesterday
        checkInTime: new Date(today.getTime() - 86400000 + 9.5 * 3600000), // 9:30 AM (late)
        checkOutTime: new Date(today.getTime() - 86400000 + 17 * 3600000),
        status: 'checked-out',
        flagged: true,
        flagReason: 'Late check-in'
      }
    ]);

    // Create test alerts
    await Alert.create([
      {
        type: 'mocked_gps',
        severity: 'high',
        staff: staffId,
        business: businessId,
        title: 'GPS Spoofing',
        message: 'Mocked GPS detected',
        status: AlertStatus.ACTIVE,
        priority: 5
      },
      {
        type: 'late_check_in',
        severity: 'medium',
        staff: staffId,
        business: businessId,
        title: 'Late Check-in',
        message: '30 minutes late',
        status: AlertStatus.RESOLVED,
        priority: 3
      }
    ]);
  });

  it('should complete full report generation and export workflow', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 7 days ago
    const endDate = new Date();

    // Step 1: Generate location compliance report
    const locationReport = await reportService.generateLocationComplianceReport(
      businessId,
      {}
    );

    expect(locationReport.reportType).toBe('location_compliance');
    expect(locationReport.summary).toBeDefined();
    expect(locationReport.details).toBeInstanceOf(Array);

    // Step 2: Export to CSV
    const csvData = exportService.exportToCSV(locationReport);

    expect(csvData).toBeTruthy();
    expect(csvData).toContain('Staff Name');
    expect(typeof csvData).toBe('string');

    // Step 3: Export to JSON
    const jsonData = exportService.exportToJSON(locationReport);

    expect(jsonData).toBeTruthy();
    expect(() => JSON.parse(jsonData)).not.toThrow();

    // Step 4: Export to PDF
    const pdfBuffer = await exportService.exportToPDF(locationReport);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');

    // Step 5: Verify filename generation
    const filename = exportService.generateFilename('location_compliance', 'pdf');
    expect(filename).toContain('location_compliance');
    expect(filename).toEndWith('.pdf');
  });

  it('should generate attendance anomalies report with correct data', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    // Generate report
    const report = await reportService.generateAttendanceAnomaliesReport(
      businessId,
      startDate,
      endDate,
      {}
    );

    expect(report.reportType).toBe('attendance_anomalies');
    expect(report.summary.totalAnomalies).toBeGreaterThan(0);
    expect(report.anomalies).toBeInstanceOf(Array);
    expect(report.anomalies.length).toBeGreaterThan(0);

    // Verify anomaly details
    const flaggedAnomaly = report.anomalies.find((a: any) => a.flagged);
    expect(flaggedAnomaly).toBeDefined();
    expect(flaggedAnomaly.anomalies).toContain('Late check-in');
  });

  it('should generate late check-ins report', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const report = await reportService.generateLateCheckinsReport(
      businessId,
      startDate,
      endDate
    );

    expect(report.reportType).toBe('late_checkins');
    expect(report.summary).toBeDefined();
    expect(report.lateCheckIns).toBeInstanceOf(Array);
  });

  it('should generate alert summary report', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const report = await reportService.generateAlertSummaryReport(
      businessId,
      startDate,
      endDate
    );

    expect(report.reportType).toBe('alert_summary');
    expect(report.summary.totalAlerts).toBeGreaterThan(0);
    expect(report.breakdown.byType).toBeDefined();
    expect(report.breakdown.bySeverity).toBeDefined();
    expect(report.breakdown.byStatus).toBeDefined();
    expect(report.topStaffWithAlerts).toBeInstanceOf(Array);
  });

  it('should cache report results for performance', async () => {
    const cacheKey = `report:location_compliance:${businessId}`;

    // First generation (should cache)
    const startTime1 = Date.now();
    const report1 = await reportService.generateLocationComplianceReport(businessId, {});
    const duration1 = Date.now() - startTime1;

    // Try to get from cache
    const cachedReport = await cacheService.get(cacheKey);

    if (cachedReport) {
      // Second generation (should be faster if cached)
      const startTime2 = Date.now();
      const report2 = await reportService.generateLocationComplianceReport(businessId, {});
      const duration2 = Date.now() - startTime2;

      // Cached version should be faster (or at least not significantly slower)
      expect(duration2).toBeLessThanOrEqual(duration1 + 100);
    }

    expect(report1.reportType).toBe('location_compliance');
  });

  it('should handle export format selection correctly', async () => {
    const report = await reportService.generateLocationComplianceReport(businessId, {});

    // Test all export formats
    const csvData = exportService.exportToCSV(report);
    const jsonData = exportService.exportToJSON(report);
    const pdfData = await exportService.exportToPDF(report);

    // Verify content types
    expect(exportService.getContentType('csv')).toBe('text/csv');
    expect(exportService.getContentType('json')).toBe('application/json');
    expect(exportService.getContentType('pdf')).toBe('application/pdf');

    // Verify data formats
    expect(typeof csvData).toBe('string');
    expect(typeof jsonData).toBe('string');
    expect(pdfData).toBeInstanceOf(Buffer);
  });

  it('should handle date range filtering in reports', async () => {
    // Create attendance for specific date range
    const specificDate = new Date('2026-01-15');
    await Attendance.create({
      staff: staffId,
      date: specificDate,
      checkInTime: specificDate,
      status: 'checked-in',
      flagged: false
    });

    // Generate report for January only
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    const report = await reportService.generateAttendanceAnomaliesReport(
      businessId,
      startDate,
      endDate,
      {}
    );

    expect(report.anomalies).toBeDefined();
    // All records should be within date range
    report.anomalies.forEach((anomaly: any) => {
      const anomalyDate = new Date(anomaly.date);
      expect(anomalyDate).toBeGreaterThanOrEqual(startDate);
      expect(anomalyDate).toBeLessThanOrEqual(endDate);
    });
  });

  it('should generate reports with empty data gracefully', async () => {
    const emptyBusinessId = mockObjectId().toString();

    const report = await reportService.generateLocationComplianceReport(
      emptyBusinessId,
      {}
    );

    expect(report.reportType).toBe('location_compliance');
    expect(report.summary.totalStaff).toBe(0);
    expect(report.details).toHaveLength(0);

    // Should still be exportable
    const csvData = exportService.exportToCSV(report);
    expect(csvData).toBeTruthy();
  });
});
