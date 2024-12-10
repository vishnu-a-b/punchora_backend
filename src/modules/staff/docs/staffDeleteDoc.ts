import { Request, Response, NextFunction } from "express";

export const staffDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Staff']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
