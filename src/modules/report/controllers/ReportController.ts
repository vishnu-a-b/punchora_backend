import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import ReportService from "../services/ReportService";
import ExportService from "../services/ExportService";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";

export default class ReportController extends BaseController {
  private service = new ReportService();
  private exportService = new ExportService();

  /**
   * Generate Location Compliance Report
   * GET /v1/reports/location-compliance
   */
  getLocationComplianceReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, business, department } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        throw new BadRequestError({
          error: "startDate and endDate are required",
        });
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const filter: any = {};
      const businessFilter = (req as any).businessFilter;
      if (businessFilter) {
        filter.business = businessFilter;
      } else if (business) {
        filter.business = business;
      }
      if (department) filter.department = department;

      const report = await this.service.generateLocationComplianceReport(
        dateRange,
        filter
      );

      this.sendSuccessResponse(res, 200, {
        message: "Location compliance report generated successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate Attendance Anomalies Report
   * GET /v1/reports/attendance-anomalies
   */
  getAttendanceAnomaliesReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, business, department } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError({
          error: "startDate and endDate are required",
        });
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const filter: any = {};
      const businessFilter = (req as any).businessFilter;
      if (businessFilter) {
        filter.business = businessFilter;
      } else if (business) {
        filter.business = business;
      }
      if (department) filter.department = department;

      const report = await this.service.generateAttendanceAnomaliesReport(
        dateRange,
        filter
      );

      this.sendSuccessResponse(res, 200, {
        message: "Attendance anomalies report generated successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate Late Check-ins Report
   * GET /v1/reports/late-checkins
   */
  getLateCheckinsReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, business, department, threshold } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError({
          error: "startDate and endDate are required",
        });
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const filter: any = {};
      const businessFilter = (req as any).businessFilter;
      if (businessFilter) {
        filter.business = businessFilter;
      } else if (business) {
        filter.business = business;
      }
      if (department) filter.department = department;
      if (threshold) filter.thresholdMinutes = parseInt(threshold as string);

      const report = await this.service.generateLateCheckinsReport(
        dateRange,
        filter
      );

      this.sendSuccessResponse(res, 200, {
        message: "Late check-ins report generated successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate Alert Summary Report
   * GET /v1/reports/alert-summary
   */
  getAlertSummaryReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, business } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError({
          error: "startDate and endDate are required",
        });
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const filter: any = {};
      const businessFilter = (req as any).businessFilter;
      if (businessFilter) {
        filter.business = businessFilter;
      } else if (business) {
        filter.business = business;
      }

      const report = await this.service.generateAlertSummaryReport(
        dateRange,
        filter
      );

      this.sendSuccessResponse(res, 200, {
        message: "Alert summary report generated successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate Dashboard Report (all metrics combined)
   * GET /v1/reports/dashboard
   */
  getDashboardReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, business } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError({
          error: "startDate and endDate are required",
        });
      }

      const dateRange = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const filter: any = {};
      const businessFilter = (req as any).businessFilter;
      if (businessFilter) {
        filter.business = businessFilter;
      } else if (business) {
        filter.business = business;
      }

      const report = await this.service.generateDashboardReport(
        dateRange,
        filter
      );

      this.sendSuccessResponse(res, 200, {
        message: "Dashboard report generated successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export any report to various formats
   * POST /v1/reports/export
   */
  exportReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportData, format } = req.body;

      if (!reportData) {
        throw new BadRequestError({
          error: "reportData is required in request body",
        });
      }

      const exportFormat = (format || "csv").toLowerCase();

      let exportedData: string | Buffer;
      let contentType: string;
      let filename: string;

      switch (exportFormat) {
        case "csv":
          exportedData = this.exportService.exportToCSV(reportData);
          contentType = this.exportService.getContentType("csv");
          filename = this.exportService.generateFilename(
            reportData.reportType || "report",
            "csv"
          );
          break;

        case "json":
          exportedData = this.exportService.exportToJSON(reportData);
          contentType = this.exportService.getContentType("json");
          filename = this.exportService.generateFilename(
            reportData.reportType || "report",
            "json"
          );
          break;

        case "pdf":
          // PHASE 5: PDF export now fully implemented (async)
          exportedData = await this.exportService.exportToPDF(reportData);
          contentType = this.exportService.getContentType("pdf");
          filename = this.exportService.generateFilename(
            reportData.reportType || "report",
            "pdf"
          );
          break;

        default:
          throw new BadRequestError({
            error: "Invalid format. Supported: csv, json, pdf",
          });
      }

      // Set headers for file download
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      res.send(exportedData);
    } catch (error) {
      next(error);
    }
  };
}
