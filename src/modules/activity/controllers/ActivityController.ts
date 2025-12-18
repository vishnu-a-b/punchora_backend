import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import ActivityService from "../services/ActivityService";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";

export default class ActivityController extends BaseController {
  private service = new ActivityService();

  /**
   * Start a new activity
   */
  startActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationFailedError({ errors: errors.array() });
      }

      const user = (req as any).user;
      const files = (req as any).files;

      // Get staff record for this user
      const { Staff } = await import("../../staff/models/Staff");
      const staff = await Staff.findOne({ user: user._id });

      if (!staff) {
        throw new NotFoundError({ error: "Staff record not found" });
      }

      // Handle file uploads
      let photoUrl = req.body.photo;
      let vehiclePhotoUrl = req.body.vehiclePhoto;

      if (files) {
        if (files.photo && files.photo[0]) {
          photoUrl = files.photo[0].path || files.photo[0].filename;
        }
        if (files.vehiclePhoto && files.vehiclePhoto[0]) {
          vehiclePhotoUrl = files.vehiclePhoto[0].path || files.vehiclePhoto[0].filename;
        }
      }

      const activityData = {
        staff: staff._id.toString(),
        business: staff.business.toString(),
        department: staff.department?.toString(),
        type: req.body.type,
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        location: req.body.location,
        reason: req.body.reason,
        photo: photoUrl,
        meterReadingStart: req.body.meterReadingStart ? parseFloat(req.body.meterReadingStart) : undefined,
        vehiclePhoto: vehiclePhotoUrl,
        gpsLocation: req.body.gpsLocation ? JSON.parse(req.body.gpsLocation) : undefined
      };

      const activity = await this.service.startActivity(activityData);

      this.sendSuccessResponse(res, 201, {
        message: "Activity started successfully",
        data: activity
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * End an ongoing activity
   */
  endActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const activity = await this.service.getActivityById(id);

      if (!activity) {
        throw new NotFoundError({ error: "Activity not found" });
      }

      // Verify this activity belongs to the user
      const { Staff } = await import("../../staff/models/Staff");
      const staff = await Staff.findOne({ user: user._id });

      if (!staff || activity.staff.toString() !== staff._id.toString()) {
        throw new BadRequestError({ error: "Unauthorized" });
      }

      const endData = {
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
        meterReadingEnd: req.body.meterReadingEnd
      };

      const updatedActivity = await this.service.endActivity(id, endData);

      this.sendSuccessResponse(res, 200, {
        message: "Activity ended successfully",
        data: updatedActivity
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get my activities
   */
  getMyActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { skip, limit, startDate, endDate, type, status } = req.query;

      // Get staff record for this user
      const { Staff } = await import("../../staff/models/Staff");
      const staff = await Staff.findOne({ user: user._id });

      if (!staff) {
        throw new NotFoundError({ error: "Staff record not found" });
      }

      const options = {
        skip: skip ? parseInt(skip as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        type: type as string,
        status: status as string
      };

      const result = await this.service.getStaffActivities(
        staff._id.toString(),
        options
      );

      this.sendSuccessResponse(res, 200, {
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get ongoing activities
   */
  getOngoing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Get staff record for this user
      const { Staff } = await import("../../staff/models/Staff");
      const staff = await Staff.findOne({ user: user._id });

      if (!staff) {
        throw new NotFoundError({ error: "Staff record not found" });
      }

      const activities = await this.service.getOngoingActivities(
        staff._id.toString()
      );

      this.sendSuccessResponse(res, 200, { data: activities });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get activity by ID
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const activity = await this.service.getActivityById(id);

      if (!activity) {
        throw new NotFoundError({ error: "Activity not found" });
      }

      this.sendSuccessResponse(res, 200, { data: activity });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get business activities (Admin only)
   */
  getBusinessActivities = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).user;
      const { skip, limit, startDate, endDate, type, departmentId } = req.query;

      // Get business ID from user or query
      let businessId = user.business;

      // Super admin can query any business
      if (user.role === "super-admin" && req.query.businessId) {
        businessId = req.query.businessId;
      }

      if (!businessId) {
        throw new BadRequestError({ error: "Business ID required" });
      }

      const options = {
        skip: skip ? parseInt(skip as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        type: type as string,
        departmentId: departmentId as string
      };

      const result = await this.service.getBusinessActivities(
        businessId,
        options
      );

      this.sendSuccessResponse(res, 200, {
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get activity statistics
   */
  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { startDate, endDate } = req.query;

      // Get staff record for this user
      const { Staff } = await import("../../staff/models/Staff");
      const staff = await Staff.findOne({ user: user._id });

      if (!staff) {
        throw new NotFoundError({ error: "Staff record not found" });
      }

      if (!startDate || !endDate) {
        throw new BadRequestError({
          error: "Start date and end date are required"
        });
      }

      const stats = await this.service.getActivityStats(
        staff._id.toString(),
        new Date(startDate as string),
        new Date(endDate as string)
      );

      this.sendSuccessResponse(res, 200, { data: stats });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete activity
   */
  deleteActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const activity = await this.service.getActivityById(id);

      if (!activity) {
        throw new NotFoundError({ error: "Activity not found" });
      }

      // Verify this activity belongs to the user (or user is admin)
      if (
        user.role !== "super-admin" &&
        user.role !== "business-admin"
      ) {
        const { Staff } = await import("../../staff/models/Staff");
        const staff = await Staff.findOne({ user: user._id });

        if (!staff || activity.staff.toString() !== staff._id.toString()) {
          throw new BadRequestError({ error: "Unauthorized" });
        }
      }

      await this.service.deleteActivity(id);

      this.sendSuccessResponse(res, 200, {
        data: { message: "Activity deleted successfully" }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get business activity statistics (Admin only)
   */
  getBusinessStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { startDate, endDate, businessId } = req.query;

      if (!startDate || !endDate) {
        throw new BadRequestError({ error: "Start date and end date are required" });
      }

      // Get business ID
      let targetBusinessId = user.business;
      if (user.role === "super-admin" && businessId) {
        targetBusinessId = businessId;
      }

      if (!targetBusinessId) {
        throw new BadRequestError({ error: "Business ID required" });
      }

      const { Activity } = await import("../models/Activity");
      const mongoose = await import("mongoose");

      const stats = await Activity.aggregate([
        {
          $match: {
            business: new mongoose.Types.ObjectId(targetBusinessId as string),
            startTime: {
              $gte: new Date(startDate as string),
              $lte: new Date(endDate as string)
            }
          }
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalDuration: { $sum: "$duration" },
            avgDuration: { $avg: "$duration" }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      this.sendSuccessResponse(res, 200, { data: stats });
    } catch (error) {
      next(error);
    }
  };
}
