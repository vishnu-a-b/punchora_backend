import { Request, Response, NextFunction } from "express";
import BaseController from "../../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../../errors/errorTypes/ValidationFailedError";
import SpecialityService from "../services/SpecialityService";

export default class SpecialityController extends BaseController {
  service = new SpecialityService();
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const specialities = await this.service.list();
      this.sendSuccessResponse(res, 200, { data: specialities });
    } catch (e: any) {
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
      const speciality = await this.service.create(req.body);
      this.sendSuccessResponse(res, 201, { data: speciality });
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
