import { Request, Response, NextFunction } from "express";
import BaseController from "../../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../../errors/errorTypes/ValidationFailedError";
import DistrictService from "../services/DistrictService";

export default class DistrictController extends BaseController {
  service = new DistrictService();
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filterQuery, sort } = req;
      const data = await this.service.list({
        limit: 100,
        skip: 0,
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
      const district = await this.service.create(req.body);
      this.sendSuccessResponse(res, 201, { data: district });
    } catch (e: any) {
      next(e);
    }
  };
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      this.sendSuccessResponse(res, 204, { data: {} });
    } catch (e: any) {
      next(e);
    }
  };
}
