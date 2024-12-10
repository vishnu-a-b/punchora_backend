import { Request, Response, NextFunction } from "express";

export const specialityDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Speciality']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
