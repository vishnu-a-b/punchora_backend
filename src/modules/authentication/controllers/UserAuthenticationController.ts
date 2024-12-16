import { Request, Response, NextFunction } from "express";
import UserAuthenticationService from "../services/UserAuthenticationService";
import BaseController from "../../base/controllers.ts/BaseController";
import ServerError from "../../../errors/errorTypes/ServerError";
import AuthenticationFailedError from "../../../errors/errorTypes/AuthenticationFailedError";
import verifyRefreshToken from "../utils/verifyRefreshToken";
import { User } from "../../user/models/User";
import BadRequestError from "../../../errors/errorTypes/BadRequestError";
import CustomError from "../../../errors/errorTypes/CustomError";

export default class UserAuthenticationController extends BaseController {
  service = new UserAuthenticationService();

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw new AuthenticationFailedError({ error: "user not found" });
      }
      const tokenData = await this.service.jwtCreate(user.id);
      this.sendSuccessResponse(res, 200, {
        message: "user authenticated successfully",
        data: {
          ...{
            id: user.id,
            isSuperAdmin: user.isSuperAdmin,
            roles: user.roles,
          },
          ...tokenData,
        },
      });
    } catch (e: any) {
      next(new AuthenticationFailedError({ error: e.message }));
    }
  };

  verifyRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const refreshToken = req.body.refreshToken;
      let userId: any;
      if (!refreshToken) {
        throw new BadRequestError({ error: "invalid refreshToken" });
      }
      try {
        const { id }: any = await verifyRefreshToken(refreshToken);
        userId = id;
      } catch (e: any) {
        throw new AuthenticationFailedError({ error: e.message });
      }

      const user = await User.findOne({ _id: userId }).populate("roles");
      if (!user) {
        throw new AuthenticationFailedError({ error: "user not found" });
      }
      const tokenData = await this.service.jwtCreate(userId);
      this.sendSuccessResponse(res, 200, {
        message: "token refreshed successfully",
        data: {
          ...{
            id: user.id,
            isSuperAdmin: user.isSuperAdmin,
            roles: user.roles,
          },
          ...tokenData,
        },
      });
    } catch (e: any) {
      if (e instanceof CustomError) {
        next(e);
        return;
      }
      next(new ServerError({ error: e.error || e.message }));
    }
  };
}
