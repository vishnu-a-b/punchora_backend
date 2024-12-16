import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import RoleService from "../services/RoleService";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";

export default class RoleController extends BaseController {
  service = new RoleService();
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

  getOneBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await this.service.findOneBySlug(req.params.slug);
      if (!patient) {
        throw new NotFoundError({ error: "Role not found" });
      }
      this.sendSuccessResponse(res, 200, { data: patient });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid slug" }));
      }
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
      const role = await this.service.create(req.body);
      this.sendSuccessResponse(res, 201, { data: role });
    } catch (e: any) {
      next(e);
    }
  };
}
