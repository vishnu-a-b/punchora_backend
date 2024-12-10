import { Request, Response, NextFunction } from "express";
import BaseController from "../../../base/controllers.ts/BaseController";
import { validationResult } from "express-validator";
import ValidationFailedError from "../../../../errors/errorTypes/ValidationFailedError";
import TalukService from "../services/TalukService";

export default class TalukController extends BaseController {
  service = new TalukService();
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search } = req.query;
      const { filterQuery, sort } = req;
      const taluks = await this.service.list(
        search as string,
        filterQuery,
        sort
      );
      this.sendSuccessResponse(res, 200, { data: taluks });
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
      const taluk = await this.service.create(req.body);
      this.sendSuccessResponse(res, 201, { data: taluk });
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
