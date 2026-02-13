/**
 * Integration Tests for Report API
 * Tests report generation and export endpoints
 */

import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { setupTestDB } from '../helpers/database';
import { mockObjectId } from '../helpers/fixtures';
import ReportService from '../../src/modules/report/services/ReportService';
import ExportService from '../../src/modules/report/services/ExportService';

describe('Report API Integration', () => {
  setupTestDB();

  let app: express.Application;
  let businessId: string;
  let userId: string;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = {
        _id: userId,
        role: 'admin',
        businessId: businessId
      };
      next();
    });

    // Setup report routes
    const reportRouter = Router();
    const reportService = new ReportService();
    const exportService = new ExportService();

    // POST /api/reports/generate - Generate report
    reportRouter.post('/generate', async (req, res) => {
      try {
        const { reportType, startDate, endDate, businessId, options } = req.body;

        let report;
        switch (reportType) {
          case 'location_compliance':
            report = await reportService.generateLocationComplianceReport(businessId, options);
            break;
          case 'attendance_anomalies':
            report = await reportService.generateAttendanceAnomaliesReport(
              businessId,
              new Date(startDate),
              new Date(endDate),
              options
            );
            break;
          case 'late_checkins':
            report = await reportService.generateLateCheckinsReport(
              businessId,
              new Date(startDate),
              new Date(endDate)
            );
            break;
          case 'alert_summary':
            report = await reportService.generateAlertSummaryReport(
              businessId,
              new Date(startDate),
              new Date(endDate)
            );
            break;
          default:
            return res.status(400).json({ error: 'Invalid report type' });
        }

        res.json(report);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // POST /api/reports/export - Export report
    reportRouter.post('/export', async (req, res) => {
      try {
        const { reportData, format } = req.body;

        let exportedData;
        let contentType;

        switch (format) {
          case 'csv':
            exportedData = exportService.exportToCSV(reportData);
            contentType = 'text/csv';
            break;
          case 'json':
            exportedData = exportService.exportToJSON(reportData);
            contentType = 'application/json';
            break;
          case 'pdf':
            exportedData = await exportService.exportToPDF(reportData);
            contentType = 'application/pdf';
            break;
          default:
            return res.status(400).json({ error: 'Invalid format' });
        }

        const filename = exportService.generateFilename(reportData.reportType, format);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportedData);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.use('/api/reports', reportRouter);
  });

  beforeEach(() => {
    businessId = mockObjectId().toString();
    userId = mockObjectId().toString();
  });

  describe('POST /api/reports/generate', () => {
    it('should generate location compliance report', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .send({
          reportType: 'location_compliance',
          businessId: businessId,
          options: {}
        })
        .expect(200);

      expect(response.body.reportType).toBe('location_compliance');
      expect(response.body.summary).toBeDefined();
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('should generate attendance anomalies report', async () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-12');

      const response = await request(app)
        .post('/api/reports/generate')
        .send({
          reportType: 'attendance_anomalies',
          businessId: businessId,
          startDate,
          endDate,
          options: {}
        })
        .expect(200);

      expect(response.body.reportType).toBe('attendance_anomalies');
      expect(response.body.summary).toBeDefined();
      expect(response.body.anomalies).toBeInstanceOf(Array);
    });

    it('should generate late check-ins report', async () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-12');

      const response = await request(app)
        .post('/api/reports/generate')
        .send({
          reportType: 'late_checkins',
          businessId: businessId,
          startDate,
          endDate
        })
        .expect(200);

      expect(response.body.reportType).toBe('late_checkins');
      expect(response.body.summary).toBeDefined();
      expect(response.body.lateCheckIns).toBeInstanceOf(Array);
    });

    it('should generate alert summary report', async () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-12');

      const response = await request(app)
        .post('/api/reports/generate')
        .send({
          reportType: 'alert_summary',
          businessId: businessId,
          startDate,
          endDate
        })
        .expect(200);

      expect(response.body.reportType).toBe('alert_summary');
      expect(response.body.summary).toBeDefined();
    });

    it('should return error for invalid report type', async () => {
      const response = await request(app)
        .post('/api/reports/generate')
        .send({
          reportType: 'invalid_type',
          businessId: businessId
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid report type');
    });
  });

  describe('POST /api/reports/export', () => {
    const mockReportData = {
      reportType: 'location_compliance',
      summary: { totalStaff: 10 },
      details: [
        {
          staffName: 'John Doe',
          staffUid: 'STAFF001',
          hasLocationData: true
        }
      ]
    };

    it('should export report as CSV', async () => {
      const response = await request(app)
        .post('/api/reports/export')
        .send({
          reportData: mockReportData,
          format: 'csv'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.text).toContain('Staff Name');
    });

    it('should export report as JSON', async () => {
      const response = await request(app)
        .post('/api/reports/export')
        .send({
          reportData: mockReportData,
          format: 'json'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('.json');
      expect(() => JSON.parse(response.text)).not.toThrow();
    });

    it('should export report as PDF', async () => {
      const response = await request(app)
        .post('/api/reports/export')
        .send({
          reportData: mockReportData,
          format: 'pdf'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('.pdf');
      // PDF files start with %PDF
      expect(response.body.toString('utf-8', 0, 4)).toBe('%PDF');
    });

    it('should return error for invalid format', async () => {
      const response = await request(app)
        .post('/api/reports/export')
        .send({
          reportData: mockReportData,
          format: 'invalid'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid format');
    });
  });
});
