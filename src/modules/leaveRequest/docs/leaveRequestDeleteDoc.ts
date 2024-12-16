import { Request, Response, NextFunction } from "express";

export const leaveRequestDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Leave-Request']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
