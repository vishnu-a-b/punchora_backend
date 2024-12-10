import { Request, Response, NextFunction } from "express";

export const talukListDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Taluk']
     #swagger.responses[200] = {
      description: 'Endpoint to get all Taluks',
      schema: {
        success: true,
        data: {
          total: 1,
          limit: 10,
          skip: 0,
          items: [
            {
              _id: "65cd9d8d5cae5ffc348ed638",
              name: "string",
              district: "65cd9d8d5cae4ffc348ed698"
            }
          ]
        }
      }
    }
    #swagger.security = [
      {
        JWT: []
      }
    ] 
  */
  next();
};
