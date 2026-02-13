/**
 * Unit Tests for ExportService
 * Tests report export functionality (CSV, JSON, PDF)
 */

import ExportService from '../../src/modules/report/services/ExportService';
import { setupTestDB } from '../helpers/database';

describe('ExportService', () => {
  setupTestDB();

  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  describe('exportToCSV - Location Compliance Report', () => {
    it('should export location compliance report to CSV', () => {
      const reportData = {
        reportType: 'location_compliance',
        details: [
          {
            staffName: 'John Doe',
            staffUid: 'STAFF001',
            business: 'Acme Corp',
            department: 'Engineering',
            hasLocationData: true,
            lastLocationTimestamp: new Date('2026-02-12T10:00:00Z'),
            mockedGPSCount: 0,
            locationAccuracy: 10
          },
          {
            staffName: 'Jane Smith',
            staffUid: 'STAFF002',
            business: 'Acme Corp',
            department: 'HR',
            hasLocationData: false,
            lastLocationTimestamp: null,
            mockedGPSCount: 2,
            locationAccuracy: 0
          }
        ]
      };

      const csv = exportService.exportToCSV(reportData);

      expect(csv).toContain('Staff Name,Staff UID,Business,Department');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('STAFF001');
      expect(csv).toContain('Engineering');
      expect(csv).toContain('Jane Smith');
      expect(csv).toContain('STAFF002');
    });
  });

  describe('exportToCSV - Attendance Anomalies Report', () => {
    it('should export attendance anomalies report to CSV', () => {
      const reportData = {
        reportType: 'attendance_anomalies',
        anomalies: [
          {
            date: new Date('2026-02-12'),
            staff: { name: 'John Doe', uid: 'STAFF001' },
            business: 'Acme Corp',
            department: 'Engineering',
            checkInTime: new Date('2026-02-12T09:30:00Z'),
            checkOutTime: new Date('2026-02-12T17:30:00Z'),
            anomalies: ['Late check-in', 'Early check-out'],
            flagged: true,
            flagStatus: 'pending'
          }
        ]
      };

      const csv = exportService.exportToCSV(reportData);

      expect(csv).toContain('Date,Staff Name,Staff UID');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('Late check-in; Early check-out');
      expect(csv).toContain('Yes');
      expect(csv).toContain('pending');
    });
  });

  describe('exportToCSV - Late Check-ins Report', () => {
    it('should export late check-ins report to CSV', () => {
      const reportData = {
        reportType: 'late_checkins',
        lateCheckIns: [
          {
            date: new Date('2026-02-12'),
            staff: { name: 'John Doe', uid: 'STAFF001' },
            business: 'Acme Corp',
            department: 'Engineering',
            expectedTime: new Date('2026-02-12T09:00:00Z'),
            actualCheckInTime: new Date('2026-02-12T09:30:00Z'),
            minutesLate: 30,
            location: { latitude: 12.9716, longitude: 77.5946 }
          }
        ]
      };

      const csv = exportService.exportToCSV(reportData);

      expect(csv).toContain('Date,Staff Name,Staff UID');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('30');
      expect(csv).toContain('12.9716');
      expect(csv).toContain('77.5946');
    });
  });

  describe('exportToCSV - Alert Summary Report', () => {
    it('should export alert summary report to CSV', () => {
      const reportData = {
        reportType: 'alert_summary',
        topStaffWithAlerts: [
          { staffName: 'John Doe', staffUid: 'STAFF001', count: 5 },
          { staffName: 'Jane Smith', staffUid: 'STAFF002', count: 3 }
        ],
        breakdown: {
          byType: {
            'mocked_gps': 4,
            'late_check_in': 4
          }
        }
      };

      const csv = exportService.exportToCSV(reportData);

      expect(csv).toContain('Staff Name,Staff UID,Alert Count');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('5');
      expect(csv).toContain('Alert Type Breakdown');
      expect(csv).toContain('mocked_gps,4');
      expect(csv).toContain('late_check_in,4');
    });
  });

  describe('exportToCSV - Generic Report', () => {
    it('should export unknown report type to generic CSV', () => {
      const reportData = {
        reportType: 'unknown_type',
        data: { test: 'value' }
      };

      const csv = exportService.exportToCSV(reportData);

      expect(csv).toContain('Report Data');
      expect(csv).toContain('unknown_type');
    });
  });

  describe('exportToJSON', () => {
    it('should export report data to formatted JSON', () => {
      const reportData = {
        reportType: 'test_report',
        summary: { total: 10, flagged: 2 },
        details: [{ id: 1, name: 'Test' }]
      };

      const json = exportService.exportToJSON(reportData);

      expect(json).toBeTruthy();
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.reportType).toBe('test_report');
      expect(parsed.summary.total).toBe(10);
      expect(parsed.details).toHaveLength(1);
    });

    it('should format JSON with proper indentation', () => {
      const reportData = { test: 'value' };
      const json = exportService.exportToJSON(reportData);

      // Check for indentation (2 spaces)
      expect(json).toContain('  ');
    });
  });

  describe('exportToPDF', () => {
    it('should generate PDF buffer for location compliance report', async () => {
      const reportData = {
        reportType: 'location_compliance',
        summary: {
          totalStaff: 2,
          staffWithLocation: 1,
          averageAccuracy: 10
        },
        details: [
          {
            staffName: 'John Doe',
            staffUid: 'STAFF001',
            hasLocationData: true,
            mockedGPSCount: 0
          }
        ]
      };

      const pdfBuffer = await exportService.exportToPDF(reportData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });

    it('should generate PDF buffer for attendance anomalies report', async () => {
      const reportData = {
        reportType: 'attendance_anomalies',
        summary: { totalAnomalies: 1 },
        anomalies: [
          {
            date: new Date('2026-02-12'),
            staff: { name: 'John Doe' },
            anomalies: ['Late check-in']
          }
        ]
      };

      const pdfBuffer = await exportService.exportToPDF(reportData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should generate PDF buffer for late check-ins report', async () => {
      const reportData = {
        reportType: 'late_checkins',
        summary: { totalLateCheckIns: 1 },
        lateCheckIns: [
          {
            date: new Date('2026-02-12'),
            staff: { name: 'John Doe' },
            minutesLate: 30
          }
        ]
      };

      const pdfBuffer = await exportService.exportToPDF(reportData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should generate PDF buffer for alert summary report', async () => {
      const reportData = {
        reportType: 'alert_summary',
        summary: { totalAlerts: 5 },
        topStaffWithAlerts: [
          { staffName: 'John Doe', count: 5 }
        ]
      };

      const pdfBuffer = await exportService.exportToPDF(reportData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should generate PDF buffer for activity summary report', async () => {
      const reportData = {
        reportType: 'activity_summary',
        summary: { totalActivities: 10 },
        activities: []
      };

      const pdfBuffer = await exportService.exportToPDF(reportData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with report type and timestamp', () => {
      const filename = exportService.generateFilename('attendance_report', 'csv');

      expect(filename).toContain('attendance_report');
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/); // Date pattern
      expect(filename).toMatch('.csv');
    });

    it('should generate filename for different formats', () => {
      const csvFilename = exportService.generateFilename('test', 'csv');
      const jsonFilename = exportService.generateFilename('test', 'json');
      const pdfFilename = exportService.generateFilename('test', 'pdf');

      expect(csvFilename).toMatch('.csv');
      expect(jsonFilename).toMatch('.json');
      expect(pdfFilename).toMatch('.pdf');
    });

    it('should replace special characters in timestamp', () => {
      const filename = exportService.generateFilename('test', 'csv');

      // Filename should not contain colons or periods (except before extension)
      const withoutExtension = filename.replace('.csv', '');
      expect(withoutExtension).not.toContain(':');
      expect(withoutExtension).not.toContain('.');
    });
  });

  describe('getContentType', () => {
    it('should return correct content type for CSV', () => {
      const contentType = exportService.getContentType('csv');
      expect(contentType).toBe('text/csv');
    });

    it('should return correct content type for JSON', () => {
      const contentType = exportService.getContentType('json');
      expect(contentType).toBe('application/json');
    });

    it('should return correct content type for PDF', () => {
      const contentType = exportService.getContentType('pdf');
      expect(contentType).toBe('application/pdf');
    });

    it('should return default content type for unknown format', () => {
      const contentType = exportService.getContentType('unknown');
      expect(contentType).toBe('text/plain');
    });
  });
});
