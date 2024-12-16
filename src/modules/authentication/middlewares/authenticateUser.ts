import { Request, Response, NextFunction } from "express";
import AuthenticationFailedError from "../../../errors/errorTypes/AuthenticationFailedError";
import Configs from "../../../configs/configs";
const passport = require("passport");

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("jwt", { session: false }, (error: any, user: any) => {
    if (error) {
      next(new AuthenticationFailedError({ error }));
    }
    if (!user) {
      next(
        new AuthenticationFailedError({
          error: "invalid authentication token",
        })
      );
    }
    req.user = user;
    next();
  })(req, res, next);
};
