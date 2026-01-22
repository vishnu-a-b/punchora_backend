import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import AlertService from "../services/AlertService";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import { AlertType, AlertSeverity, AlertStatus } from "../models/Alert";

export default class AlertController extends BaseController {
  private service = new AlertService();

  /**
   * Get all alerts with filters
   * GET /v1/alerts
   */
  getAllAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const businessFilter = (req as any).businessFilter;

      const filters: any = {
        type: req.query.type as AlertType,
        severity: req.query.severity as AlertSeverity,
        status: req.query.status as AlertStatus,
        staff: req.query.staff as string,
      };

      // Apply business scoping
      if (businessFilter) {
        filters.business = businessFilter;
      }

      // Date range
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      // Acknowledged/resolved filters
      if (req.query.acknowledged !== undefined) {
        filters.acknowledged = req.query.acknowledged === "true";
      }
      if (req.query.resolved !== undefined) {
        filters.resolved = req.query.resolved === "true";
      }

      const options = {
        skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        populate: true,
      };

      const { alerts, total } = await this.service.getAlerts(filters, options);

      this.sendSuccessResponseList(res, 200, {
        message: "Alerts retrieved successfully",
        data: {
          total,
          skip: options.skip,
          limit: options.limit,
          items: alerts,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get active alerts only
   * GET /v1/alerts/active
   */
  getActiveAlerts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const businessFilter = (req as any).businessFilter;

      const alerts = await this.service.getActiveAlerts(businessFilter);

      this.sendSuccessResponse(res, 200, {
        message: "Active alerts retrieved successfully",
        data: {
          alerts,
          count: alerts.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get alert statistics
   * GET /v1/alerts/stats
   */
  getAlertStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessFilter = (req as any).businessFilter;

      const stats = await this.service.getAlertStats(businessFilter);

      this.sendSuccessResponse(res, 200, {
        message: "Alert statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get alert by ID
   * GET /v1/alerts/:id
   */
  getAlertById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const alert = await this.service.getAlertById(id);

      if (!alert) {
        throw new NotFoundError({ error: "Alert not found" });
      }

      // Business scoping check
      const businessFilter = (req as any).businessFilter;
      if (businessFilter && alert.business.toString() !== businessFilter) {
        throw new BadRequestError({ error: "Unauthorized access to alert" });
      }

      this.sendSuccessResponse(res, 200, {
        message: "Alert retrieved successfully",
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Acknowledge an alert
   * POST /v1/alerts/:id/acknowledge
   */
  acknowledgeAlert = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // First check if alert exists and user has access
      const existingAlert = await this.service.getAlertById(id);
      if (!existingAlert) {
        throw new NotFoundError({ error: "Alert not found" });
      }

      // Business scoping check
      const businessFilter = (req as any).businessFilter;
      if (
        businessFilter &&
        existingAlert.business.toString() !== businessFilter
      ) {
        throw new BadRequestError({ error: "Unauthorized access to alert" });
      }

      const alert = await this.service.acknowledgeAlert(id, {
        userId: user._id.toString(),
        userName: user.name,
      });

      this.sendSuccessResponse(res, 200, {
        message: "Alert acknowledged successfully",
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resolve an alert
   * POST /v1/alerts/:id/resolve
   */
  resolveAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { resolutionNotes } = req.body;

      // First check if alert exists and user has access
      const existingAlert = await this.service.getAlertById(id);
      if (!existingAlert) {
        throw new NotFoundError({ error: "Alert not found" });
      }

      // Business scoping check
      const businessFilter = (req as any).businessFilter;
      if (
        businessFilter &&
        existingAlert.business.toString() !== businessFilter
      ) {
        throw new BadRequestError({ error: "Unauthorized access to alert" });
      }

      const alert = await this.service.resolveAlert(id, {
        userId: user._id.toString(),
        resolutionNotes,
      });

      this.sendSuccessResponse(res, 200, {
        message: "Alert resolved successfully",
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Dismiss an alert
   * POST /v1/alerts/:id/dismiss
   */
  dismissAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // First check if alert exists and user has access
      const existingAlert = await this.service.getAlertById(id);
      if (!existingAlert) {
        throw new NotFoundError({ error: "Alert not found" });
      }

      // Business scoping check (only super admin and control room can dismiss)
      if (
        user.role !== "super-admin" &&
        user.role !== "control-room"
      ) {
        throw new BadRequestError({
          error: "Only Super Admin and Control Room can dismiss alerts",
        });
      }

      const alert = await this.service.dismissAlert(id);

      this.sendSuccessResponse(res, 200, {
        message: "Alert dismissed successfully",
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get alerts for a specific staff member
   * GET /v1/alerts/staff/:staffId
   */
  getStaffAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { staffId } = req.params;
      const activeOnly = req.query.activeOnly === "true";

      const count = await this.service.getStaffAlertCount(staffId, activeOnly);

      const { alerts, total } = await this.service.getAlerts(
        { staff: staffId },
        { limit: 50, populate: true }
      );

      this.sendSuccessResponse(res, 200, {
        message: "Staff alerts retrieved successfully",
        data: {
          alerts,
          total,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
