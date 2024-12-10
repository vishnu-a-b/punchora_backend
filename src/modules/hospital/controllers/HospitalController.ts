import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../errors/errorTypes/ValidationFailedError";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";
import mongoose from "mongoose";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import HospitalService from "../services/HospitalService";
import Configs from "../../../configs/configs";
import UserService from "../../user/services/UserService";

export default class HospitalController extends BaseController {
  service = new HospitalService();
  userService = new UserService();
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        next(new ValidationFailedError({ errors: errors.array() }));
        return;
      }
      let photoUrls: any[] = [];
      if (req.files) {
        (req.files as Express.Multer.File[])!.forEach((file) => {
          photoUrls.push(Configs.domain + file.filename);
        });
        req.body.photos = photoUrls;
      }
      const hospital = await this.service.create(req.body);

      this.sendSuccessResponse(res, 201, { data: hospital });
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
      const hospital = await this.service.findOne(req.params.id);
      if (!hospital) {
        throw new NotFoundError({ error: "hospital not found" });
      }
      this.sendSuccessResponse(res, 200, { data: hospital });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid hospital_id" }));
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
      let photoUrls: any[] = [];
      if (req.files) {
        (req.files as Express.Multer.File[])!.forEach((file) => {
          photoUrls.push(Configs.domain + file.filename);
        });
        req.body.photos = photoUrls;
      }
      const hospital = await this.service.update({
        id: req.params.id,
        hospital: req.body,
      });
      if (!hospital) {
        throw new NotFoundError({ error: "hospital not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: hospital!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid hospital_id" }));
      }
      next(e);
    }
  };
  updateVcLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { vcLink } = req.body;
      if (!vcLink) {
        next(new ValidationFailedError({ errors: ["vcLink required"] }));
        return;
      }
      const hospital = await this.service.update({
        id: req.params.id,
        hospital: { vcLink },
      });
      if (!hospital) {
        throw new NotFoundError({ error: "hospital not found" });
      }
      this.sendSuccessResponse(res, 200, { data: { _id: hospital!._id } });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid hospital_id" }));
      }
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospital = await this.service.delete(req.params.id);
      if (!hospital) {
        throw new NotFoundError({ error: "hospital not found" });
      }
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid hospital_id" }));
      }
      next(e);
    }
  };

  filterByAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitals = await this.service.filterByAdmin(req.params.id);
      this.sendSuccessResponse(res, 200, { data: hospitals });
    } catch (e: any) {
      if (e instanceof mongoose.Error.CastError) {
        next(new BadRequestError({ error: "invalid admin_d" }));
      }
      next(e);
    }
  };
}
