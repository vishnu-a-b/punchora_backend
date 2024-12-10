import { Request, Response, NextFunction } from "express";

export const hospitalCountDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
    #swagger.tags = ['Hospital']
    #swagger.responses[200] = {
      description: 'Endpoint to total Hospitals count',
    }
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
