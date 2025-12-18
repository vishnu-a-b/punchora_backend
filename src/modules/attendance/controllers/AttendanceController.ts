import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import AttendanceService from "../services/AttendanceService";
import { FaceRecognitionService } from "../../../services/facialRecognitionservice";
import { Staff } from "../../staff/models/Staff";
import Configs from "../../../configs/configs";
import AttendanceError from "../../../errors/errorTypes/AttendanceError";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import mongoose from "mongoose";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";

export default class AttendanceController extends BaseController {
  service = new AttendanceService();
  facialRecognitionService = new FaceRecognitionService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      let body = req.body;
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.checkInPhoto?.[0]) {
          body.checkInPhoto =
            Configs.domain + "attendance/" + files.checkInPhoto?.[0].filename;
        }
        if (files.checkOutPhoto?.[0]) {
          body.checkOutPhoto =
            Configs.domain + "attendance/" + files.checkOutPhoto?.[0].filename;
        }
      }
      const attendance = await this.service.create(req.body);

      this.sendSuccessResponse(res, 201, { data: attendance });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid data" }));
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
      let body = req.body;
      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        if (files.checkInPhoto?.[0]) {
          body.checkInPhoto =
            Configs.domain + "attendance/" + files.checkInPhoto?.[0].filename;
        }
        if (files.checkOutPhoto?.[0]) {
          body.checkOutPhoto =
            Configs.domain + "attendance/" + files.checkOutPhoto?.[0].filename;
        }
      }
      const attendance = await this.service.update(req.params.id, body);
      if (!attendance) {
        throw new NotFoundError({ error: "attendance not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: attendance!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid attendance_id" }));
      }
      next(e);
    }
  };

  markAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("=== MARK ATTENDANCE REQUEST RECEIVED ===");
      console.log("Request body:", req.body);
      console.log("Request file:", req.file ? { filename: req.file.filename, mimetype: req.file.mimetype } : "NO FILE");
      console.log("Content-Type:", req.headers['content-type']);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        throw new ValidationFailedError({ errors: errors.array() });
      }
      const body = req.body;
      if (!body.checkOutTime && !body.checkInTime) {
        console.error("Missing checkOutTime and checkInTime");
        throw new ValidationFailedError({
          error: "checkOutTime or checkInTime required",
        });
      }
      if (!req.file) {
        console.error("No photo provided");
        throw new ValidationFailedError({ errors: ["no photo provided"] });
      }
      body.photo = Configs.domain + "attendance/" + req.file!.filename;
      console.log("Photo URL:", body.photo);
      let data: any;
      if (body.checkIn === "false") {
        if (!body.checkOutLocation) {
          throw new ValidationFailedError({
            errors: ["checkOutLocation required"],
          });
        }
        data = await this.service.checkOut({
          date: body.date,
          checkOutTime: new Date(),
          staff: body.staff,
          checkOutPhoto: body.photo,
          checkOutLocation: JSON.parse(body.checkOutLocation),
          idempotencyKey: body.idempotencyKey,  // NEW
        });
      }
      if (body.checkIn === "true") {
        if (!body.checkInLocation) {
          throw new ValidationFailedError({
            errors: ["checkInLocation required"],
          });
        }
        data = await this.service.checkIn({
          date: body.date,
          checkInTime: new Date(),
          staff: body.staff,
          checkInPhoto: body.photo,
          checkInLocation: JSON.parse(body.checkInLocation),
          createdBy: req.user._id,
          idempotencyKey: body.idempotencyKey,  // NEW
        });
      }
      this.sendSuccessResponse(res, 201, { data });
    } catch (e: any) {
      next(e);
    }
  };

  markAttendanceViaRecognition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationFailedError({ errors: errors.array() });
      }
      const body = req.body;
      if (!req.file) {
        throw new ValidationFailedError({ errors: ["no photo provided"] });
      }
      body.photo = Configs.domain + "attendance/" + req.file!.filename;
      const user = await this.facialRecognitionService.recognizeUser(
        req.file!.path
      );
      if (!user) {
        throw new AttendanceError({
          error: "facial recognition failed. No user found",
        });
      }
      const staff = await Staff.findOne({ user: user.id });
      if (!staff) {
        throw new AttendanceError({
          error: "facial recognition failed. No staff found",
        });
      }
      // Parse location if it's a string (from FormData)
      let parsedLocation = body.location;
      if (typeof body.location === 'string') {
        parsedLocation = JSON.parse(body.location);
      }

      await this.service.mark({
        staff: staff.id,
        photo: body.photo,
        location: parsedLocation,
        idempotencyKey: body.idempotencyKey,  // NEW
      });

      this.sendSuccessResponse(res, 201, { data: staff });
    } catch (e: any) {
      next(e);
    }
  };

  getAttendanceForStaff = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { limit, skip } = req.query;
      const { filterQuery, sort } = req;
      const staffId = req.params.id;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        throw new ValidationFailedError({
          errors: ["startDate & endDate required as query parameters"],
        });
      }
      const data = await this.service.filterByDate(
        new Date(startDate as string),
        new Date(endDate as string),
        staffId,
      );

      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  getDatewiseAttendanceForAllStaffs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate, status } = req.query;
      if (!startDate || !endDate || !status) {
        throw new ValidationFailedError({
          errors: ["startDate, endDate & status required as query parameters"],
        });
      }
      const data = await this.service.filterAllStaffsByDate(
        new Date(startDate as string),
        new Date(endDate as string),
        status as string
      );

      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attendance = await this.service.delete(req.params.id);
      if (!attendance) {
        throw new NotFoundError({ error: "attendance not found" });
      }
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid attendance_id" }));
      }
      next(e);
    }
  };

  // NEW: Get flagged attendance records
  getFlaggedAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await this.service.getFlaggedAttendance(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  // NEW: Clear flag from attendance record
  clearAttendanceFlag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const attendance = await this.service.clearFlag(id, note);
      if (!attendance) {
        throw new NotFoundError({ error: "attendance not found" });
      }
      this.sendSuccessResponse(res, 200, { data: attendance });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid attendance_id" }));
      }
      next(e);
    }
  };
}
