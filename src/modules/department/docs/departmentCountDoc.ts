import { Request, Response, NextFunction } from "express";

export const departmentCountDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
    #swagger.tags = ['Department']
    #swagger.responses[200] = {
      description: 'Endpoint to total departments count',
    }
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
