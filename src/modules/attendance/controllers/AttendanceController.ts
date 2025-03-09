import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import AttendanceService from "../services/AttendanceService";
import { FaceRecognitionService } from "../../../services/facialRecognitionservice";
import { Staff } from "../../staff/models/Staff";
import Configs from "../../../configs/configs";
import AttendanceError from "../../../errors/errorTypes/AttendanceError";

export default class AttendanceController extends BaseController {
  service = new AttendanceService();
  facialRecognitionService = new FaceRecognitionService();

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
      if (!req.file) {
        throw new ValidationFailedError({ errors: ["no photo provided"] });
      }
      body.photo = Configs.domain + req.file!.filename;
      let data: any;
      if (body.checkIn === "false") {
        if (!body.checkOutLocation) {
          throw new ValidationFailedError({
            errors: ["checkOutLocation required"],
          });
        }
        data = await this.service.checkOut({
          date: body.date,
          checkOutTime: body.checkOutTime,
          staff: body.staff,
          checkOutPhoto: body.photo,
          checkOutLocation: JSON.parse(body.checkOutLocation),
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
          checkInTime: body.checkInTime,
          staff: body.staff,
          checkInPhoto: body.photo,
          checkInLocation: JSON.parse(body.checkInLocation),
          createdBy: req.user._id,
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
      if (!body.checkOutTime && !body.checkInTime) {
        throw new ValidationFailedError({
          errors: ["checkOutTime or checkInTime required"],
        });
      }
      if (!req.file) {
        throw new ValidationFailedError({ errors: ["no photo provided"] });
      }
      body.photo = Configs.domain + req.file!.filename;
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
      if (body.checkIn === "false") {
        if (!body.checkOutLocation) {
          throw new ValidationFailedError({
            errors: ["checkOutLocation required"],
          });
        }
        await this.service.checkOut({
          date: body.date,
          checkOutTime: body.checkOutTime,
          staff: staff.id,
          checkOutPhoto: body.photo,
          checkOutLocation: JSON.parse(body.checkOutLocation),
        });
      }
      if (body.checkIn === "true") {
        if (!body.checkInLocation) {
          throw new ValidationFailedError({
            errors: ["checkInLocation required"],
          });
        }
        await this.service.checkIn({
          date: body.date,
          checkInTime: body.checkInTime,
          staff: staff.id,
          checkInPhoto: body.photo,
          checkInLocation: JSON.parse(body.checkInLocation),
        });
      }

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
        staffId
      );

      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };
}
