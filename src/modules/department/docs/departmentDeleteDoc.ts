import { Request, Response, NextFunction } from "express";

export const departmentDeleteDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Department']
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
