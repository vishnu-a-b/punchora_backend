import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import LocationAlertService from "../services/LocationAlertService";

export default class LocationAlertController extends BaseController {
  service = new LocationAlertService();

  // Get all alerts
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, skip, acknowledged, alertType, severity, businessId } = req.query;

      const data = await this.service.list({
        limit: limit ? Number(limit) : undefined,
        skip: skip ? Number(skip) : undefined,
        acknowledged: acknowledged === "true" ? true : acknowledged === "false" ? false : undefined,
        alertType: alertType as string | undefined,
        severity: severity as string | undefined,
        businessId: businessId as string | undefined,
      });

      this.sendSuccessResponseList(res, 200, { data });
    } catch (e) {
      next(e);
    }
  };

  // Create alert
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await this.service.create(req.body);
      this.sendSuccessResponse(res, 201, { data: alert });
    } catch (e: any) {
      next(e);
    }
  };

  // Acknowledge alert
  acknowledge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId; // From auth middleware

      const alert = await this.service.acknowledge(id, userId);
      this.sendSuccessResponse(res, 200, { data: alert });
    } catch (e: any) {
      next(e);
    }
  };

  // Resolve alert
  resolve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const alert = await this.service.resolve(id);
      this.sendSuccessResponse(res, 200, { data: alert });
    } catch (e: any) {
      next(e);
    }
  };

  // Generate alerts from failed attempts
  generateFromFailedAttempts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts = await this.service.generateAlertsFromFailedAttempts();
      this.sendSuccessResponse(res, 201, { data: { alerts, count: alerts.length } });
    } catch (e: any) {
      next(e);
    }
  };

  // Generate alerts from mocked GPS
  generateFromMockedGPS = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts = await this.service.generateAlertsFromMockedGPS();
      this.sendSuccessResponse(res, 201, { data: { alerts, count: alerts.length } });
    } catch (e: any) {
      next(e);
    }
  };

  // Cleanup old alerts
  cleanup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { daysOld } = req.query;
      const count = await this.service.cleanupOldAlerts(
        daysOld ? Number(daysOld) : undefined
      );
      this.sendSuccessResponse(res, 200, { data: { deletedCount: count } });
    } catch (e: any) {
      next(e);
    }
  };
}
