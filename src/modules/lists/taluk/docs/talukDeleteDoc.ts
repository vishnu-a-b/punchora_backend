import { Request, Response, NextFunction } from "express";

export const talukDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Taluk']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
