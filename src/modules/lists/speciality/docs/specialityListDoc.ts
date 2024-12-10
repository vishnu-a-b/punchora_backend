import { Request, Response, NextFunction } from "express";

export const specialityListDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Speciality']
     #swagger.responses[200] = {
      description: 'Endpoint to get all Specialities',
      schema: {
        success: true,
        data: {
          total: 1,
          limit: 10,
          skip: 0,
          items: [
            {
              _id: "65cd9d8d5cae5ffc348ed638",
              title: "string",
              slug: "string"
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
