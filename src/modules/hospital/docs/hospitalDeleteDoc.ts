import { Request, Response, NextFunction } from "express";

export const hospitalDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Hospital']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
