import { Request, Response, NextFunction } from "express";

export const staffCountDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
    #swagger.tags = ['Staff']
    #swagger.responses[200] = {
      description: 'Endpoint to get total Staffs count',
    }
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
