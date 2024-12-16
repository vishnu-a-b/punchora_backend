import { Request, Response, NextFunction } from "express";
import PermissionDeniedError from "../errors/errorTypes/PermissionDeniedError";

const authorizeUser = ({ allowedRoles }: { allowedRoles: any[] }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (user.isSuperAdmin) {
        next();
        return;
      }
      const userRoles = user.roles.map((role: any) => role.slug);

      for (const role of userRoles) {
        if (allowedRoles.includes(role)) {
          next();
          return;
        }
      }
      next(
        new PermissionDeniedError({
          error: "you are not allowed to perform this action",
        })
      );
    } catch (e: any) {
      next(e);
    }
  };
};

export default authorizeUser;
