import { Request, Response, NextFunction } from "express";

export const businessDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Business']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
