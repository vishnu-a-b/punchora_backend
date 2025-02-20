import { Request, Response, NextFunction } from "express";

export const locationDataListDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['LocationData']
     #swagger.responses[200] = {
      description: 'Endpoint to get Location Data',
      schema: {
        success: true,
        data: [{
              _id: "65cd9d8d5cae5ffc348ed638",
              staff: "65cd9d8d5cae5ffc348ed638",
              checkInTime: 231323,
              checkOutTime: 1232131.3,
              createdBy: "65cd9d8d5cae4ffc348ed682",
              createdAt: "2024-02-17T07:50:12.025Z",
              updatedAt: "2024-02-17T07:50:12.025Z",
            }]
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
