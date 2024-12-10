import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import AttendanceService from "../services/AttendanceService";

export default class AttendanceController extends BaseController {
  service = new AttendanceService();
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
      let data: any;
      if (body.checkOutTime) {
        data = await this.service.checkOut({
          date: body.date,
          checkOutTime: body.checkOutTime,
          staff: body.staff,
        });
      }
      if (body.checkInTime) {
        data = await this.service.checkIn({
          date: body.date,
          checkInTime: body.checkOutTime,
          staff: body.staff,
          createdBy: req.user._id,
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
