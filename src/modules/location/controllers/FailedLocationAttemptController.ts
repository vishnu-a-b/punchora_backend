import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import FailedLocationAttemptService from "../services/FailedLocationAttemptService";

export default class FailedLocationAttemptController extends BaseController {
  service = new FailedLocationAttemptService();

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
      const attempt = await this.service.create(req.body);
      this.sendSuccessResponse(res, 201, { data: attempt });
    } catch (e: any) {
      next(e);
    }
  };

  insertMany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.insertMany(req.body);
      this.sendSuccessResponse(res, 201, { data: data });
    } catch (e: any) {
      next(e);
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
      const data = await this.service.filterByDate(
        new Date(startDate as string),
        new Date(endDate as string),
        staff as string | undefined
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attempt = await this.service.findOne(req.params.id);
      if (!attempt) {
        throw new NotFoundError({ error: "Failed location attempt not found" });
      }
      this.sendSuccessResponse(res, 200, { data: attempt });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid attempt_id" }));
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
      const attempt = await this.service.update({
        id: req.params.id,
        body: req.body,
      });
      if (!attempt) {
        throw new NotFoundError({ error: "Failed location attempt not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: attempt!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid attempt_id" }));
      }
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attempt = await this.service.delete(req.params.id);
      if (!attempt) {
        throw new NotFoundError({ error: "Failed location attempt not found" });
      }
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid attempt_id" }));
      }
      next(e);
    }
  };

  // Get staff with location currently disabled
  getStaffWithLocationDisabled = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { businessId, lastMinutes } = req.query;
      const data = await this.service.getStaffWithLocationDisabled(
        businessId as string | undefined,
        lastMinutes ? Number(lastMinutes) : 10
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };

  // Get location failure summary
  getLocationFailureSummary = async (
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
      const data = await this.service.getLocationFailureSummary(
        new Date(startDate as string),
        new Date(endDate as string),
        businessId as string | undefined
      );
      this.sendSuccessResponse(res, 200, { data });
    } catch (e: any) {
      next(e);
    }
  };
}
