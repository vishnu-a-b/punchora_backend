import { Request, Response, NextFunction } from "express";
import authenticationFailedError from "../../../errors/errorTypes/AuthenticationFailedError";
const passport = require("passport");

export const loginMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("local", (error: any, user: any) => {
    if (error) {
      next(new authenticationFailedError({ error }));
    }
    if (!user) {
      next(
        new authenticationFailedError({
          error: "username or password is invalid",
        })
      );
    }
    req.user = user;
    next();
  })(req, res, next);
};
