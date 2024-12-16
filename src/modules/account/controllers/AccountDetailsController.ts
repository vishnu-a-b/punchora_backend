import { Request, Response, NextFunction } from "express";
import BaseController from "../../base/controllers.ts/BaseController";
import UserService from "../../user/services/UserService";
import NotFoundError from "../../../errors/errorTypes/NotFoundError";

export default class AccountDetailsController extends BaseController {
  userService = new UserService();

  details = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.findOne(req.user._id);
      if (!user) {
        throw new NotFoundError({ error: "user not found" });
      }
      this.sendSuccessResponse(res, 200, { data: user });
    } catch (e: any) {
      next(e);
    }
  };
}
