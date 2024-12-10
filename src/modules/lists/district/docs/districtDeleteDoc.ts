import { Request, Response, NextFunction } from "express";

export const districtDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['District']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
