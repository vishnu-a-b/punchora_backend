import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import AuditService, { AuditLogFilter } from "../services/AuditService";
import { AuditAction } from "../models/AuditLog";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";

export default class AuditController extends BaseController {
  private service = new AuditService();

  /**
   * Get audit logs with filters
   * GET /v1/audit/logs
   */
  getLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        userId,
        resource,
        resourceId,
        action,
        business,
        status,
        startDate,
        endDate,
        skip,
        limit,
      } = req.query;

      const filter: AuditLogFilter = {};
      if (userId) filter.userId = userId as string;
      if (resource) filter.resource = resource as string;
      if (resourceId) filter.resourceId = resourceId as string;
      if (action) filter.action = action as AuditAction;
      if (business) filter.business = business as string;
      if (status) filter.status = status as "success" | "failure";
      if (startDate) filter.startDate = new Date(startDate as string);
      if (endDate) filter.endDate = new Date(endDate as string);

      const options = {
        skip: skip ? parseInt(skip as string) : 0,
        limit: limit ? parseInt(limit as string) : 50,
      };

      const { logs, total } = await this.service.query(filter, options);

      this.sendSuccessResponseList(res, 200, {
        message: "Audit logs retrieved successfully",
        data: {
          total,
          skip: options.skip,
          limit: options.limit,
          items: logs,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single audit log by ID
   * GET /v1/audit/logs/:id
   */
  getLogById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const log = await this.service.getById(id);

      if (!log) {
        throw new NotFoundError({ error: "Audit log not found" });
      }

      this.sendSuccessResponse(res, 200, {
        message: "Audit log retrieved successfully",
        data: log,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get logs for specific user
   * GET /v1/audit/users/:userId
   */
  getUserLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { skip, limit } = req.query;

      const options = {
        skip: skip ? parseInt(skip as string) : 0,
        limit: limit ? parseInt(limit as string) : 50,
      };

      const { logs, total } = await this.service.getUserLogs(userId, options);

      this.sendSuccessResponseList(res, 200, {
        message: "User audit logs retrieved successfully",
        data: {
          total,
          skip: options.skip,
          limit: options.limit,
          items: logs,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get logs for specific resource
   * GET /v1/audit/resources/:type/:id
   */
  getResourceLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { type, id } = req.params;
      const { skip, limit } = req.query;

      const options = {
        skip: skip ? parseInt(skip as string) : 0,
        limit: limit ? parseInt(limit as string) : 50,
      };

      const { logs, total } = await this.service.getResourceLogs(
        type,
        id,
        options
      );

      this.sendSuccessResponseList(res, 200, {
        message: "Resource audit logs retrieved successfully",
        data: {
          total,
          skip: options.skip,
          limit: options.limit,
          items: logs,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get audit statistics
   * GET /v1/audit/stats
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, business, startDate, endDate } = req.query;

      const filter: AuditLogFilter = {};
      if (userId) filter.userId = userId as string;
      if (business) filter.business = business as string;
      if (startDate) filter.startDate = new Date(startDate as string);
      if (endDate) filter.endDate = new Date(endDate as string);

      const stats = await this.service.getStatistics(filter);

      this.sendSuccessResponse(res, 200, {
        message: "Audit statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent activity
   * GET /v1/audit/recent
   */
  getRecentActivity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { limit } = req.query;

      const logs = await this.service.getRecentActivity(
        limit ? parseInt(limit as string) : 100
      );

      this.sendSuccessResponse(res, 200, {
        message: "Recent activity retrieved successfully",
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search audit logs
   * GET /v1/audit/search
   */
  searchLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, skip, limit } = req.query;

      if (!q) {
        throw new BadRequestError({ error: "Search query 'q' is required" });
      }

      const options = {
        skip: skip ? parseInt(skip as string) : 0,
        limit: limit ? parseInt(limit as string) : 50,
      };

      const { logs, total } = await this.service.search(q as string, options);

      this.sendSuccessResponseList(res, 200, {
        message: "Audit logs search completed successfully",
        data: {
          total,
          skip: options.skip,
          limit: options.limit,
          items: logs,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export audit logs
   * POST /v1/audit/export
   */
  exportLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { format, filter } = req.body;

      if (!format) {
        throw new BadRequestError({ error: "Export format is required" });
      }

      // Get logs based on filter
      const { logs } = await this.service.query(filter || {}, { limit: 10000 });

      let exportedData: string;
      let contentType: string;
      let filename: string;

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      switch (format.toLowerCase()) {
        case "csv":
          exportedData = this.service.exportToCSV(logs);
          contentType = "text/csv";
          filename = `audit_logs_${timestamp}.csv`;
          break;

        case "json":
          exportedData = this.service.exportToJSON(logs);
          contentType = "application/json";
          filename = `audit_logs_${timestamp}.json`;
          break;

        default:
          throw new BadRequestError({
            error: "Invalid format. Supported: csv, json",
          });
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(exportedData);
    } catch (error) {
      next(error);
    }
  };
}
