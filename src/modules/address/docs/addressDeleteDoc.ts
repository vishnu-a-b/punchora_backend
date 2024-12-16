import { Request, Response, NextFunction } from "express";

export const addressDeletesDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Address']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
