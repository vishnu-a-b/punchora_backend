import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import LocationDataService from "../services/LocationDataService";
import { getIO } from "../../../socket/SocketServer";
import { Staff } from "../../staff/models/Staff";

export default class LocationDataController extends BaseController {
  service = new LocationDataService();

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, skip, search } = req.query;
      const { filterQuery, sort } = req;
      const data = await this.service.list({
        limit: Number(limit),
        skip: Number(skip),
        filterQuery,
        sort,
      });
      this.sendSuccessResponseList(res, 200, { data });
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      const location = await this.service.create(req.body);
      this.sendSuccessResponse(res, 201, { data: location });
    } catch (e: any) {
      next(e);
    }
  };

  insertMany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!Array.isArray(req.body) || req.body.length === 0) {
        next(new ValidationFailedError({ errors: ["body must be a non-empty array"] }));
        return;
      }
      const data = await this.service.insertMany(req.body);
      this.sendSuccessResponse(res, 201, { data: data });

      // Emit dept-live-location socket events so the department map updates
      // without requiring an active live-tracking session
      try {
        const io = getIO();
        // Pick the latest location per staff from the batch
        const latestByStaff = new Map<string, any>();
        for (const loc of req.body) {
          const staffId = loc.staff?.toString();
          if (!staffId) continue;
          const existing = latestByStaff.get(staffId);
          if (!existing || new Date(loc.date) > new Date(existing.date)) {
            latestByStaff.set(staffId, loc);
          }
        }
        if (latestByStaff.size === 0) return;

        const staffIds = Array.from(latestByStaff.keys()).map((id) => new mongoose.Types.ObjectId(id));
        const staffDocs = await Staff.find({ _id: { $in: staffIds } }).select("name department").lean();

        for (const staffDoc of staffDocs) {
          const loc = latestByStaff.get(staffDoc._id.toString());
          if (!loc || !(staffDoc as any).department) continue;
          const deptId = (staffDoc as any).department.toString();
          const room = io.sockets.adapter.rooms.get(`live-dept:${deptId}`);
          if (!room || room.size === 0) continue; // nobody watching this dept, skip
          io.to(`live-dept:${deptId}`).emit("dept-live-location", {
            staffId: staffDoc._id.toString(),
            staffName: (staffDoc as any).name,
            departmentId: deptId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy ?? null,
            timestamp: loc.date,
          });
        }
      } catch (_) { /* non-fatal — response already sent */ }
    } catch (e: any) {
      if (e instanceof mongoose.Error.ValidationError) {
        next(new ValidationFailedError({ errors: [e.message] }));
      } else {
        next(e);
      }
    }
  };

  filterByDate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, staff } = req.query;
      if (!(startDate && endDate)) {
        throw new ValidationFailedError({
          errors: ["startDate & endDate required as query parameters"],
        });
      }
      const { sessionId } = req.query;
      const data = await this.service.filterByDate(
        new Date(startDate as string),
        new Date(endDate as string),
        staff as string | undefined,
        sessionId as string | undefined  // Fix 7
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  getLastSeenLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, business } = req.query;
      if (!(startDate && endDate)) {
        throw new ValidationFailedError({
          errors: ["startDate & endDate required as query parameters"],
        });
      }
      const data = await this.service.getLastSeenLocations(
        new Date(startDate as string),
        new Date(endDate as string),
        business as string | undefined
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const location = await this.service.findOne(req.params.id);
      if (!location) {
        throw new NotFoundError({ error: "locationData not found" });
      }
      this.sendSuccessResponse(res, 200, { data: location });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid location_id" }));
      }
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      const location = await this.service.update({
        id: req.params.id,
        body: req.body,
      });
      if (!location) {
        throw new NotFoundError({ error: "location not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: location!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid location_id" }));
      }
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const location = await this.service.delete(req.params.id);
      if (!location) {
        throw new NotFoundError({ error: "location not found" });
      }
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid location_id" }));
      }
      next(e);
    }
  };

  // Get mocked GPS locations
  getMockedLocations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, businessId } = req.query;
      if (!(startDate && endDate)) {
        throw new ValidationFailedError({
          errors: ["startDate & endDate required as query parameters"],
        });
      }
      const data = await this.service.getMockedLocations(
        new Date(startDate as string),
        new Date(endDate as string),
        businessId as string | undefined
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  // Get mocked GPS summary
  getMockedGPSSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, businessId } = req.query;
      if (!(startDate && endDate)) {
        throw new ValidationFailedError({
          errors: ["startDate & endDate required as query parameters"],
        });
      }
      const data = await this.service.getMockedGPSSummary(
        new Date(startDate as string),
        new Date(endDate as string),
        businessId as string | undefined
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  // Get location tracking status for all staff
  getLocationTrackingStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { businessId } = req.query;
      const data = await this.service.getLocationTrackingStatus(
        businessId as string | undefined
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };
}
