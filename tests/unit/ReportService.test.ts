/**
 * Unit Tests for ReportService
 * Tests reporting and analytics functionality including Phase 5 optimizations
 */

import ReportService from '../../src/modules/report/services/ReportService';
import { Staff } from '../../src/modules/staff/models/Staff';
import { Attendance } from '../../src/modules/attendance/models/Attendance';
import { Alert, AlertStatus, AlertType, AlertSeverity } from '../../src/modules/alert/models/Alert';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';

describe('ReportService', () => {
  setupTestDB();

  let reportService: ReportService;
  let businessId: string;
  let departmentId: string;

  beforeEach(async () => {
    reportService = new ReportService();
    businessId = mockObjectId().toString();
    departmentId = mockObjectId().toString();

    // Create test staff
    await Staff.create([
      {
        _id: mockObjectId(),
        name: 'John Doe',
        uid: '12345',
        email: 'john@example.com',
        phone: '1234567890',
        business: businessId,
        department: departmentId,
        isActive: true
      },
      {
        _id: mockObjectId(),
        name: 'Jane Smith',
        uid: '12346',
        email: 'jane@example.com',
        phone: '9876543210',
        business: businessId,
        department: departmentId,
        isActive: true
      }
    ]);
  });

  describe('generateLocationComplianceReport', () => {
    beforeEach(async () => {
      const staffList = await Staff.find();
      const staff1 = staffList[0];
      const staff2 = staffList[1];

      await Attendance.create([
        {
          staff: staff1._id,
          date: new Date('2026-01-21'),
          checkInTime: new Date('2026-01-21T09:00:00Z'),
          checkInLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 10,
            mocked: false
          },
          status: 'checked-in'
        },
        {
          staff: staff2._id,
          date: new Date('2026-01-21'),
          checkInTime: new Date('2026-01-21T09:30:00Z'),
          checkInLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 50,
            mocked: true // GPS spoofing
          },
          status: 'checked-in'
        }
      ]);
    });

    it('should generate location compliance report with correct summary', async () => {
      const report = await reportService.generateLocationComplianceReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.reportType).toBe('location_compliance');
      expect(report.summary.totalStaff).toBe(2);
      expect(report.summary.staffWithLocation).toBe(2);
      expect(report.summary.staffWithMockedGPS).toBe(1);
      expect(report.summary.complianceRate).toBeGreaterThan(0);
    });

    it('should detect GPS spoofing in location data', async () => {
      const report = await reportService.generateLocationComplianceReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      const staffWithMockedGPS = report.details.filter(
        (staff: any) => staff.mockedGPSCount > 0
      );

      expect(staffWithMockedGPS).toHaveLength(1);
    });

    it('should handle staff without location data', async () => {
      // Create staff with no attendance
      await Staff.create({
        _id: mockObjectId(),
        name: 'No Location User',
        uid: '99999',
        email: 'nolocation@example.com',
        phone: '5555555555',
        business: businessId,
        department: departmentId,
        isActive: true
      });

      const report = await reportService.generateLocationComplianceReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.summary.totalStaff).toBe(3);
      expect(report.summary.staffWithoutLocation).toBe(1);
    });

    it('should use aggregation pipeline for performance (no N+1)', async () => {
      // This test verifies the optimization works without error
      // Create many staff members to test aggregation performance
      const manyStaff = [];
      for (let i = 0; i < 50; i++) {
        manyStaff.push({
          name: `Staff ${i}`,
          uid: `UID${i}`,
          email: `staff${i}@example.com`,
          phone: `555000${i}`,
          business: businessId,
          department: departmentId,
          isActive: true
        });
      }
      await Staff.create(manyStaff);

      const startTime = Date.now();

      const report = await reportService.generateLocationComplianceReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      const duration = Date.now() - startTime;

      expect(report.summary.totalStaff).toBeGreaterThan(50);
      // Verify performance: Should complete in < 2 seconds even with 52 staff
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('generateAttendanceAnomaliesReport', () => {
    beforeEach(async () => {
      const staffList = await Staff.find();
      const staff1 = staffList[0];

      await Attendance.create([
        {
          staff: staff1._id,
          date: new Date('2026-01-21'),
          checkInTime: new Date('2026-01-21T09:00:00Z'),
          checkOutTime: new Date('2026-01-21T09:30:00Z'), // Very short duration
          status: 'checked-out'
        },
        {
          staff: staff1._id,
          date: new Date('2026-01-20'),
          checkInTime: new Date('2026-01-20T09:00:00Z'),
          checkInLocation: { latitude: 12.9716, longitude: 77.5946, mocked: true },
          status: 'checked-in'
        }
      ]);
    });

    it('should detect short duration anomalies', async () => {
      const report = await reportService.generateAttendanceAnomaliesReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      const shortDurationAnomaly = report.anomalies.find((a: any) =>
        a.anomalies.some((anomaly: string) => anomaly.includes('short duration'))
      );

      expect(shortDurationAnomaly).toBeTruthy();
    });

    it('should detect GPS spoofing anomalies', async () => {
      const report = await reportService.generateAttendanceAnomaliesReport(
        {
          startDate: new Date('2026-01-20T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      const gpsSpoofingAnomaly = report.anomalies.find((a: any) =>
        a.anomalies.some((anomaly: string) => anomaly.includes('GPS spoofing'))
      );

      expect(gpsSpoofingAnomaly).toBeTruthy();
    });

    it('should include anomaly type breakdown', async () => {
      const report = await reportService.generateAttendanceAnomaliesReport(
        {
          startDate: new Date('2026-01-20T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.summary.anomalyTypes).toBeTruthy();
      expect(Object.keys(report.summary.anomalyTypes).length).toBeGreaterThan(0);
    });
  });

  describe('generateLateCheckinsReport', () => {
    beforeEach(async () => {
      const staffList = await Staff.find();
      const staff1 = staffList[0];

      await Attendance.create([
        {
          staff: staff1._id,
          date: new Date('2026-01-21'),
          checkInTime: new Date('2026-01-21T10:00:00Z'), // 1 hour late (expected 9:00)
          status: 'checked-in'
        }
      ]);
    });

    it('should detect late check-ins based on threshold', async () => {
      const report = await reportService.generateLateCheckinsReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        {
          business: businessId,
          thresholdMinutes: 30 // 30 minutes late threshold
        }
      );

      expect(report.lateCheckIns).toHaveLength(1);
      expect(report.lateCheckIns[0].minutesLate).toBeGreaterThan(30);
    });

    it('should calculate average minutes late', async () => {
      const report = await reportService.generateLateCheckinsReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.summary.averageMinutesLate).toBeGreaterThan(0);
    });

    it('should sort by most late first', async () => {
      const staffList = await Staff.find();
      const staff2 = staffList[1];

      await Attendance.create({
        staff: staff2._id,
        date: new Date('2026-01-21'),
        checkInTime: new Date('2026-01-21T11:00:00Z'), // 2 hours late
        status: 'checked-in'
      });

      const report = await reportService.generateLateCheckinsReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.lateCheckIns[0].minutesLate).toBeGreaterThan(
        report.lateCheckIns[1].minutesLate
      );
    });
  });

  describe('generateAlertSummaryReport', () => {
    beforeEach(async () => {
      const staffList = await Staff.find();
      const staff1 = staffList[0];

      await Alert.create([
        {
          type: AlertType.MOCKED_GPS,
          severity: AlertSeverity.HIGH,
          staff: staff1._id,
          business: businessId,
          title: 'GPS Spoofing Detected',
          message: 'Mocked GPS location detected',
          status: AlertStatus.ACTIVE,
          priority: 4,
          acknowledged: false,
          resolved: false
        },
        {
          type: AlertType.LATE_CHECKIN,
          severity: AlertSeverity.MEDIUM,
          staff: staff1._id,
          business: businessId,
          title: 'Late Check-in',
          message: 'Staff checked in 30 minutes late',
          status: AlertStatus.ACKNOWLEDGED,
          priority: 3,
          acknowledged: true,
          acknowledgedAt: new Date(),
          resolved: false
        }
      ]);
    });

    it('should generate alert summary with counts', async () => {
      const report = await reportService.generateAlertSummaryReport(
        {
          startDate: new Date('2026-01-20T00:00:00Z'),
          endDate: new Date('2026-01-22T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.summary.totalAlerts).toBe(2);
      expect(report.summary.activeAlerts).toBe(1);
      expect(report.summary.acknowledgedAlerts).toBe(1);
    });

    it('should include alert breakdown by type', async () => {
      const report = await reportService.generateAlertSummaryReport(
        {
          startDate: new Date('2026-01-20T00:00:00Z'),
          endDate: new Date('2026-01-22T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.breakdown.byType[AlertType.MOCKED_GPS]).toBe(1);
      expect(report.breakdown.byType[AlertType.LATE_CHECKIN]).toBe(1);
    });

    it('should include top staff with alerts', async () => {
      const report = await reportService.generateAlertSummaryReport(
        {
          startDate: new Date('2026-01-20T00:00:00Z'),
          endDate: new Date('2026-01-22T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.topStaffWithAlerts).toHaveLength(1);
      expect(report.topStaffWithAlerts[0].count).toBe(2);
    });
  });

  describe('generateDashboardReport', () => {
    beforeEach(async () => {
      const staffList = await Staff.find();
      const staff1 = staffList[0];

      await Attendance.create({
        staff: staff1._id,
        date: new Date('2026-01-21'),
        checkInTime: new Date('2026-01-21T09:00:00Z'),
        checkInLocation: { latitude: 12.9716, longitude: 77.5946, mocked: false },
        status: 'checked-in'
      });

      await Alert.create({
        type: AlertType.MOCKED_GPS,
        severity: AlertSeverity.HIGH,
        staff: staff1._id,
        business: businessId,
        title: 'Test Alert',
        message: 'Test message',
        status: AlertStatus.ACTIVE,
        priority: 4
      });
    });

    it('should generate comprehensive dashboard with all metrics', async () => {
      const report = await reportService.generateDashboardReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.reportType).toBe('dashboard');
      expect(report.metrics).toBeTruthy();
      expect(report.metrics.locationCompliance).toBeTruthy();
      expect(report.metrics.attendanceAnomalies).toBeTruthy();
      expect(report.metrics.lateCheckIns).toBeTruthy();
      expect(report.metrics.alerts).toBeTruthy();
    });

    it('should include detailed reports', async () => {
      const report = await reportService.generateDashboardReport(
        {
          startDate: new Date('2026-01-21T00:00:00Z'),
          endDate: new Date('2026-01-21T23:59:59Z')
        },
        { business: businessId }
      );

      expect(report.detailedReports).toBeTruthy();
      expect(report.detailedReports.locationCompliance).toBeTruthy();
      expect(report.detailedReports.attendanceAnomalies).toBeTruthy();
      expect(report.detailedReports.lateCheckIns).toBeTruthy();
      expect(report.detailedReports.alerts).toBeTruthy();
    });
  });
});
