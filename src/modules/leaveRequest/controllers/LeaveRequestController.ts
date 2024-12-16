import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import LeaveRequestService from "../services/LeaveRequestService";
import { LeaveRequest } from "../models/LeaveRequest";
import { LeaveStatus } from "../../base/enums/leaveStatus";

export default class LeaveRequestController extends BaseController {
  service = new LeaveRequestService();
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }

      const request = await this.service.createLeaveRequest(req.body);

      this.sendSuccessResponse(res, 201, { data: request });
    } catch (e: any) {
      next(e);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, skip, search } = req.query;
      const { filterQuery, sort } = req;
      const data = await this.service.find({
        limit: Number(limit),
        skip: Number(skip),
        filterQuery,
        sort,
      });

      this.sendSuccessResponseList(res, 200, { data });
    } catch (e: any) {
      console.log(e);
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

      const request = await LeaveRequest.findById(req.params.id);
      if (!request) {
        throw new Error("No leave request found");
      }
      if (request.status !== LeaveStatus.pending.toString()) {
        throw new Error("Not permitted to edit this request");
      }

      const { reason, leaveDates } = req.body;

      const leave = await this.service.update({
        id: req.params.id,
        data: { reason, leaveDates },
      });
      if (!leave) {
        throw new NotFoundError({ error: "leave request not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: leave!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid hospital_id" }));
      }
      next(e);
    }
  };

  accept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }

      const request = await LeaveRequest.findById(req.params.id);
      if (!request) {
        throw new Error("No leave request found");
      }
      if (request.status !== LeaveStatus.pending.toString()) {
        throw new Error("Not permitted to edit this request");
      }

      const { status, remarks } = req.body;

      const leave = await this.service.validateLeaveRequest({
        id: req.params.id,
        data: { status, remarks },
      });
      if (!leave) {
        throw new NotFoundError({ error: "leave request not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: leave!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid leave request_id" }));
      }
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await LeaveRequest.findById(req.params.id);
      if (!request) {
        throw new Error("No leave request found");
      }
      if (request.status !== LeaveStatus.pending.toString()) {
        throw new Error("Not permitted to delete this request");
      }
      const leave = await this.service.delete(req.params.id);
      if (!leave) {
        throw new NotFoundError({ error: "leave request not found" });
      }
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid hospital_id" }));
      }
      next(e);
    }
  };
}
