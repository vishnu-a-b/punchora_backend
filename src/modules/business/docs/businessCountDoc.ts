import { Request, Response, NextFunction } from "express";

export const businessCountDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
    #swagger.tags = ['Business']
    #swagger.responses[200] = {
      description: 'Endpoint to total business count',
    }
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
