import { Request, Response, NextFunction } from "express";

export const addressListDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Address']
     #swagger.responses[200] = {
      description: 'Endpoint to get all Addresses',
      schema: {
        success: true,
        data: {
          total: 1,
          limit: 10,
          skip: 0,
          items: [
            {
              _id: "65cd9d8d5cae5ffc348ed638",
              address: "string",
              thaluk: "string",
              district: "string",
              pinCode: "string",
              latitude: 314,
              longitude: 1.22,
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
