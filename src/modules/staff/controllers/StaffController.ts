import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import StaffService from "../services/StaffService";

export default class StaffController extends BaseController {
  service = new StaffService();
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      req.body.createdBy = req.user._id;
      const staff = await this.service.create(req.body);
      this.sendSuccessResponse(res, 201, { data: staff });
    } catch (e: any) {
      next(e);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, skip } = req.query;
      const { filterQuery, sort } = req;
      const data = await this.service.find({
        limit: Number(limit),
        skip: Number(skip),
        filterQuery,
        sort,
      });

      this.sendSuccessResponseList(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  getWithAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { limit, skip } = req.query;
      const { filterQuery, sort } = req;
      const data = await this.service.findAndGetAttendance({
        limit: Number(limit),
        skip: Number(skip),
        filterQuery,
        sort,
      });

      this.sendSuccessResponseList(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  countTotalDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const count = await this.service.countTotalDocuments();
      this.sendSuccessResponse(res, 200, { data: { count } });
    } catch (e: any) {
      next(e);
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staff = await this.service.findOne(req.params.id);
      if (!staff) {
        throw new NotFoundError({ error: "staff not found" });
      }
      this.sendSuccessResponse(res, 200, { data: staff });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid staff_id" }));
      }
      next(e);
    }
  };

  getWithUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staff = await this.service.findOneWithUserId(req.params.id);
      this.sendSuccessResponse(res, 200, { data: staff });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid staff_id" }));
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

      const staff = await this.service.update({
        id: req.params.id,
        staff: req.body,
      });
      if (!staff) {
        throw new NotFoundError({ error: "staff not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: staff!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid staff_id" }));
      }
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staff = await this.service.delete(req.params.id);
      if (!staff) {
        throw new NotFoundError({ error: "staff not found" });
      }
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid staff_id" }));
      }
      next(e);
    }
  };
}
