/**
 * Dashboard Controller
 * Handles analytics, bulk operations, and custom reports
 * Phase 6: Admin Dashboard Enhancements
 */

import { Request, Response } from 'express';
import AnalyticsService from '../../../services/AnalyticsService';
import BulkImportService from '../../../services/BulkImportService';
import BulkExportService from '../../../services/BulkExportService';
import CustomReportBuilderService from '../../../services/CustomReportBuilderService';
import DashboardCustomizationService from '../../../services/DashboardCustomizationService';

export default class DashboardController {
  private analyticsService: AnalyticsService;
  private bulkImportService: BulkImportService;
  private bulkExportService: BulkExportService;
  private customReportService: CustomReportBuilderService;
  private customizationService: DashboardCustomizationService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.bulkImportService = new BulkImportService();
    this.bulkExportService = new BulkExportService();
    this.customReportService = new CustomReportBuilderService();
    this.customizationService = new DashboardCustomizationService();
  }

  /**
   * Get dashboard analytics metrics
   * GET /api/dashboard/analytics
   */
  async getAnalytics(req: Request, res: Response) {
    try {
      const businessId = (req as any).user.business;
      const { startDate, endDate } = req.query;

      const dateRange = startDate && endDate
        ? { startDate: new Date(startDate as string), endDate: new Date(endDate as string) }
        : undefined;

      const metrics = await this.analyticsService.getDashboardMetrics(
        businessId,
        dateRange
      );

      res.json({
        success: true,
        data: metrics,
        cached: true // 1-minute cache
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get trend data for charts
   * GET /api/dashboard/trends/:metric
   */
  async getTrendData(req: Request, res: Response) {
    try {
      const businessId = (req as any).user.business;
      const { metric } = req.params;
      const { days = '7' } = req.query;

      if (!['attendance', 'alerts', 'activities'].includes(metric)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid metric. Must be: attendance, alerts, or activities'
        });
      }

      const trendData = await this.analyticsService.getTrendData(
        businessId,
        metric as any,
        parseInt(days as string)
      );

      res.json({
        success: true,
        data: trendData
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Import staff from CSV
   * POST /api/dashboard/bulk/import/staff
   */
  async importStaff(req: Request, res: Response) {
    try {
      const businessId = (req as any).user.business;
      const userId = (req as any).user._id;

      if (!req.file && !req.body.csv) {
        return res.status(400).json({
          success: false,
          error: 'CSV file or content is required'
        });
      }

      const csvContent = req.file ? req.file.buffer : req.body.csv;

      const result = await this.bulkImportService.importStaffFromCSV(
        csvContent,
        businessId,
        userId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get CSV template for staff import
   * GET /api/dashboard/bulk/import/template
   */
  async getImportTemplate(req: Request, res: Response) {
    try {
      const template = this.bulkImportService.getCSVTemplate();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=staff_import_template.csv');
      res.send(template);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Export all staff to CSV
   * GET /api/dashboard/bulk/export/staff
   */
  async exportStaff(req: Request, res: Response) {
    try {
      const businessId = (req as any).user.business;
      const userId = (req as any).user._id;
      const { department, status, role } = req.query;

      const filters: any = {};
      if (department) filters.department = department;
      if (status) filters.status = status;
      if (role) filters.role = role;

      const csv = await this.bulkExportService.exportAllStaff(
        businessId,
        filters,
        userId
      );

      const filename = this.bulkExportService.generateFilename('staff', 'csv');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Export attendance records to CSV
   * GET /api/dashboard/bulk/export/attendance
   */
  async exportAttendance(req: Request, res: Response) {
    try {
      const businessId = (req as any).user.business;
      const userId = (req as any).user._id;
      const { startDate, endDate, department, flaggedOnly } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      const filters: any = {};
      if (department) filters.department = department;
      if (flaggedOnly === 'true') filters.flaggedOnly = true;

      const csv = await this.bulkExportService.exportAttendance(
        businessId,
        new Date(startDate as string),
        new Date(endDate as string),
        filters,
        userId
      );

      const filename = this.bulkExportService.generateFilename('attendance', 'csv');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Export alerts to CSV
   * GET /api/dashboard/bulk/export/alerts
   */
  async exportAlerts(req: Request, res: Response) {
    try {
      const businessId = (req as any).user.business;
      const userId = (req as any).user._id;
      const { startDate, endDate, type, severity, status } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      const filters: any = {};
      if (type) filters.type = type;
      if (severity) filters.severity = severity;
      if (status) filters.status = status;

      const csv = await this.bulkExportService.exportAlerts(
        businessId,
        new Date(startDate as string),
        new Date(endDate as string),
        filters,
        userId
      );

      const filename = this.bulkExportService.generateFilename('alerts', 'csv');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Build custom report
   * POST /api/dashboard/reports/custom
   */
  async buildCustomReport(req: Request, res: Response) {
    try {
      const businessId = (req as any).user.business;
      const config = req.body;

      // Validate config
      const validation = this.customReportService.validateConfig(config);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const report = await this.customReportService.buildCustomReport(
        config,
        businessId
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Export custom report to CSV
   * POST /api/dashboard/reports/custom/export
   */
  async exportCustomReport(req: Request, res: Response) {
    try {
      const businessId = (req as any).user.business;
      const config = req.body;

      // Build report
      const report = await this.customReportService.buildCustomReport(
        config,
        businessId
      );

      // Export to CSV
      const csv = await this.customReportService.exportToCSV(report);

      const filename = `${config.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Save custom report configuration
   * POST /api/dashboard/reports/save
   */
  async saveReportConfig(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const config = req.body;

      // Validate config
      const validation = this.customReportService.validateConfig(config);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      await this.customReportService.saveReportConfig(config, userId);

      res.json({
        success: true,
        message: 'Report configuration saved'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get saved report configurations
   * GET /api/dashboard/reports/saved
   */
  async getSavedReports(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;

      const configs = await this.customReportService.getSavedConfigs(userId);

      res.json({
        success: true,
        data: configs
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get available fields for a report type
   * GET /api/dashboard/reports/fields/:type
   */
  async getAvailableFields(req: Request, res: Response) {
    try {
      const { type } = req.params;

      const fields = this.customReportService.getAvailableFields(type);

      res.json({
        success: true,
        data: fields
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get dashboard layout for user
   * GET /api/dashboard/layout
   */
  async getLayout(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const role = (req as any).user.role;

      const layout = await this.customizationService.getLayoutForUser(userId, role);

      res.json({
        success: true,
        data: layout
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Save dashboard layout customizations
   * POST /api/dashboard/layout
   */
  async saveLayout(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const role = (req as any).user.role;
      const { widgets } = req.body;

      if (!widgets || !Array.isArray(widgets)) {
        return res.status(400).json({
          success: false,
          error: 'widgets array is required'
        });
      }

      const layout = await this.customizationService.saveUserCustomizations(
        userId,
        role,
        widgets
      );

      res.json({
        success: true,
        data: layout
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Reset dashboard layout to default
   * POST /api/dashboard/layout/reset
   */
  async resetLayout(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const role = (req as any).user.role;

      const layout = await this.customizationService.resetToDefault(userId, role);

      res.json({
        success: true,
        data: layout
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get available widget types for user role
   * GET /api/dashboard/widgets/available
   */
  async getAvailableWidgets(req: Request, res: Response) {
    try {
      const role = (req as any).user.role;

      const widgetTypes = this.customizationService.getAvailableWidgetTypes(role);

      res.json({
        success: true,
        data: widgetTypes
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
