import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import LocationDataService from "../services/LocationDataService";

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
}
