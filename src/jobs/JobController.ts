import { Request, Response, NextFunction } from "express";
import BaseController from "../modules/base/controllers.ts/BaseController";
import AlertJobScheduler from "./AlertJobScheduler";

/**
 * Job Controller
 *
 * Provides API endpoints for manually triggering scheduled jobs
 * and checking job status. Only accessible by Super Admin.
 */
export default class JobController extends BaseController {
  private scheduler = new AlertJobScheduler();

  /**
   * Get status of all scheduled jobs
   * GET /v1/jobs/status
   */
  getJobStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = this.scheduler.getJobStatus();

      this.sendSuccessResponse(res, 200, {
        message: "Job status retrieved successfully",
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually trigger late check-in alert job
   * POST /v1/jobs/run/late-checkin
   */
  runLateCheckinJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const count = await this.scheduler.runLateCheckinJob();

      this.sendSuccessResponse(res, 200, {
        message: "Late check-in job completed successfully",
        data: {
          alertsCreated: count,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually trigger missing checkout alert job
   * POST /v1/jobs/run/missing-checkout
   */
  runMissingCheckoutJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const count = await this.scheduler.runMissingCheckoutJob();

      this.sendSuccessResponse(res, 200, {
        message: "Missing checkout job completed successfully",
        data: {
          alertsCreated: count,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually trigger expired alert cleanup
   * POST /v1/jobs/run/expired-cleanup
   */
  runExpiredCleanup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const count = await this.scheduler.runExpiredAlertCleanup();

      this.sendSuccessResponse(res, 200, {
        message: "Expired alert cleanup completed successfully",
        data: {
          alertsExpired: count,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually trigger old alert cleanup
   * POST /v1/jobs/run/old-cleanup
   */
  runOldCleanup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await this.scheduler.runOldAlertCleanup();

      this.sendSuccessResponse(res, 200, {
        message: "Old alert cleanup completed successfully",
        data: {
          alertsDeleted: count,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Run all daily jobs at once (for testing)
   * POST /v1/jobs/run/all
   */
  runAllJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await this.scheduler.runAllDailyJobs();

      this.sendSuccessResponse(res, 200, {
        message: "All daily jobs completed successfully",
        data: {
          ...results,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Initialize scheduled jobs (called on server startup)
   * This method is not exposed as an API endpoint
   */
  public initializeJobs(): void {
    this.scheduler.initializeJobs();
  }
}
