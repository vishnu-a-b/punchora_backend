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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationFailedError({ errors: errors.array() });
      }
      const body = req.body;
      if (!body.checkOutTime && !body.checkInTime) {
        throw new ValidationFailedError({
          error: "checkOutTime or checkInTime required",
        });
      }
      if (req.file) {
        body.photo = Configs.domain + "attendance/" + req.file.filename;
      }
      let data: any;
      if (body.checkIn === "false") {
        if (!body.checkOutLocation) {
          throw new ValidationFailedError({
            errors: ["checkOutLocation required"],
          });
        }
        let checkOutLocation: any;
        try { checkOutLocation = JSON.parse(body.checkOutLocation); }
        catch { throw new ValidationFailedError({ error: "invalid checkOutLocation JSON" }); }
        data = await this.service.checkOut({
          date: new Date(),
          checkOutTime: new Date(),
          staff: body.staff,
          checkOutPhoto: body.photo,
          checkOutLocation,
          idempotencyKey: body.idempotencyKey,
        });
      }
      if (body.checkIn === "true") {
        if (!body.checkInLocation) {
          throw new ValidationFailedError({
            errors: ["checkInLocation required"],
          });
        }
        let checkInLocation: any;
        try { checkInLocation = JSON.parse(body.checkInLocation); }
        catch { throw new ValidationFailedError({ error: "invalid checkInLocation JSON" }); }
        data = await this.service.checkIn({
          date: new Date(),
          checkInTime: new Date(),
          staff: body.staff,
          checkInPhoto: body.photo,
          checkInLocation,
          createdBy: req.user._id,
          idempotencyKey: body.idempotencyKey,
        });
      }
      this.sendSuccessResponse(res, 201, { data });
    } catch (e: any) {
      next(e);
    }
  };

  markAndEditAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationFailedError({ errors: errors.array() });
      }
      const body = req.body;
      if (!body.checkOutTime && !body.checkInTime) {
        throw new ValidationFailedError({
          error: "checkOutTime or checkInTime required",
        });
      }
      if (req.file) {
        body.photo = Configs.domain + "attendance/" + req.file.filename;
      }
      let data: any;
      if (body.checkIn === "false") {
        if (!body.checkOutLocation) {
          throw new ValidationFailedError({
            errors: ["checkOutLocation required"],
          });
        }
        let checkOutLocation: any;
        try { checkOutLocation = JSON.parse(body.checkOutLocation); }
        catch { throw new ValidationFailedError({ error: "invalid checkOutLocation JSON" }); }
        data = await this.service.checkOut({
          date: new Date(),
          checkOutTime: new Date(),
          staff: body.staff,
          checkOutPhoto: body.photo,
          checkOutLocation,
          idempotencyKey: body.idempotencyKey,
        });
      }
      if (body.checkIn === "true") {
        if (!body.checkInLocation) {
          throw new ValidationFailedError({
            errors: ["checkInLocation required"],
          });
        }
        let checkInLocation: any;
        try { checkInLocation = JSON.parse(body.checkInLocation); }
        catch { throw new ValidationFailedError({ error: "invalid checkInLocation JSON" }); }
        data = await this.service.checkIn({
          date: new Date(),
          checkInTime: new Date(),
          staff: body.staff,
          checkInPhoto: body.photo,
          checkInLocation,
          createdBy: req.user._id,
          idempotencyKey: body.idempotencyKey,
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

  // Get attendance with mocked/fake GPS at punch-in or punch-out
  getMockedPunches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, businessId } = req.query;
      if (!(startDate && endDate)) {
        res.status(400).json({ success: false, message: "startDate & endDate required" });
        return;
      }
      const data = await this.service.getMockedPunches(
        new Date(startDate as string),
        new Date(endDate as string),
        businessId as string | undefined
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

  /**
   * PHASE 3: Enhanced Flagging System
   */

  /**
   * Flag an attendance record for review
   * POST /v1/attendance/:id/flag
   */
  flagAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { reason, notes } = req.body;

      // Get the attendance record
      const attendance = await this.service.getById(id);
      if (!attendance) {
        throw new NotFoundError({ error: "Attendance record not found" });
      }

      // Flag the attendance
      const flaggedAttendance = await this.service.flagAttendance(id, {
        flaggedBy: user._id.toString(),
        flaggedByName: user.name,
        flagReason: reason || "other",
        flagNotes: notes,
      });

      this.sendSuccessResponse(res, 200, {
        message: "Attendance record flagged successfully",
        data: flaggedAttendance,
      });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "Invalid attendance ID" }));
      } else {
        next(e);
      }
    }
  };

  /**
   * Upload photo for an existing attendance record (staff uploads own photo in background)
   * PATCH /v1/attendance/:id/photo
   */
  uploadAttendancePhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ValidationFailedError({ errors: ["no photo provided"] });
      }

      const { id } = req.params;
      const photoType = req.body.photoType; // "checkIn" or "checkOut"
      const photoUrl = Configs.domain + "attendance/" + req.file.filename;

      const attendance = await this.service.getById(id);
      if (!attendance) {
        throw new NotFoundError({ error: "attendance not found" });
      }

      // Verify the attendance belongs to this user's staff
      const staff = await Staff.findOne({ user: req.user._id });
      if (!staff || attendance.staff._id.toString() !== staff._id.toString()) {
        throw new BadRequestError({ error: "unauthorized" });
      }

      const updateField = photoType === "checkOut" ? "checkOutPhoto" : "checkInPhoto";
      await this.service.update(id, { $set: { [updateField]: photoUrl } });

      this.sendSuccessResponse(res, 200, { data: { _id: id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid attendance_id" }));
      }
      next(e);
    }
  };

  /**
   * Review a flagged attendance record
   * POST /v1/attendance/:id/review
   */
  reviewFlag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { status, notes } = req.body;

      // Validate status
      if (!["cleared", "confirmed"].includes(status)) {
        throw new BadRequestError({
          error: "Invalid status. Must be 'cleared' or 'confirmed'",
        });
      }

      // Get the attendance record
      const attendance = await this.service.getById(id);
      if (!attendance) {
        throw new NotFoundError({ error: "Attendance record not found" });
      }

      if (!attendance.flagged) {
        throw new BadRequestError({
          error: "Attendance record is not flagged",
        });
      }

      // Review the flag
      const reviewedAttendance = await this.service.reviewFlag(id, {
        reviewedBy: user._id.toString(),
        flagStatus: status,
        reviewNotes: notes,
      });

      this.sendSuccessResponse(res, 200, {
        message: "Flag reviewed successfully",
        data: reviewedAttendance,
      });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "Invalid attendance ID" }));
      } else {
        next(e);
      }
    }
  };
}
