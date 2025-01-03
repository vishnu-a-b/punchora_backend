import { Request, Response, NextFunction } from "express";

export const userDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['User']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
