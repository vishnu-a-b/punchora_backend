import { Request, Response, NextFunction } from "express";

export default class BaseController {
  sendSuccessResponse = (
    res: Response,
    status: number,
    data: {
      message?: string;
      data: any;
    }
  ) => {
    return res.status(status).json({ ...{ success: true }, ...data });
  };

  sendSuccessResponseList = (
    res: Response,
    status: number,
    data: {
      message?: string;
      data: {
        total: number;
        limit: number;
        skip: number;
        items: any[];
      };
    }
  ) => {
    return res.status(status).json({ ...{ success: true }, ...data });
  };
}
