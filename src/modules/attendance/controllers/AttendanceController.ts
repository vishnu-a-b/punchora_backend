import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import AttendanceService from "../services/AttendanceService";
import { FaceRecognitionService } from "../../../services/facialRecognitionservice";
import { Staff } from "../../staff/models/Staff";
import Configs from "../../../configs/configs";

export default class AttendanceController extends BaseController {
  service = new AttendanceService();
  facialRecognitionService = new FaceRecognitionService();

  markAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      const body = req.body;
      if (!body.checkOutTime && !body.checkInTime) {
        throw new Error("checkOutTime or checkInTime required");
      }
      if (req.file) {
        body.photo = Configs.domain + req.file.filename;
      }
      let data: any;
      if (body.checkOutTime) {
        if (!body.checkOutLocation) {
          next(
            new ValidationFailedError({ errors: ["checkOutLocation required"] })
          );
          return;
        }
        data = await this.service.checkOut({
          date: body.date,
          checkOutTime: body.checkOutTime,
          staff: body.staff,
          checkOutPhoto: body.photo,
          checkOutLocation: body.checkOutLocation,
        });
      }
      if (body.checkInTime) {
        if (!body.checkInLocation) {
          next(
            new ValidationFailedError({ errors: ["checkOutLocation required"] })
          );
          return;
        }
        data = await this.service.checkIn({
          date: body.date,
          checkInTime: body.checkInTime,
          checkInPhoto: body.photo,
          staff: body.staff,
          createdBy: req.user._id,
          checkInLocation: body.checkInLocation,
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
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      const body = req.body;
      if (!body.checkOutTime && !body.checkInTime) {
        throw new Error("checkOutTime or checkInTime required");
      }
      if (!req.file) {
        next(new ValidationFailedError({ errors: ["no photo provided"] }));
      }
      body.photo = Configs.domain + req.file!.filename;
      const user = await this.facialRecognitionService.recognizeUser(
        req.file!.path
      );
      console.log(user);
      if (!user) {
        throw new Error("facial recognition failed. No user found");
      }
      const staff = await Staff.findOne({ user: user.id });
      console.log(staff);
      if (!staff) {
        throw new Error("facial recognition failed. No staff found");
      }
      let data: any;
      if (body.checkOutTime) {
        if (!body.checkOutLocation) {
          next(
            new ValidationFailedError({ errors: ["checkOutLocation required"] })
          );
          return;
        }
        data = await this.service.checkOut({
          date: body.date,
          checkOutTime: body.checkOutTime,
          staff: staff.id,
          checkOutPhoto: body.photo,
          checkOutLocation: body.checkOutLocation,
        });
      }
      if (body.checkInTime) {
        if (!body.checkInLocation) {
          next(
            new ValidationFailedError({ errors: ["checkOutLocation required"] })
          );
          return;
        }
        data = await this.service.checkIn({
          date: body.date,
          checkInTime: body.checkInTime,
          staff: staff.id,
          checkInPhoto: body.photo,
          checkInLocation: body.checkInLocation,
        });
      }

      this.sendSuccessResponse(res, 201, { data });
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
        throw Error("startDate & endDate required as query parameters");
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
