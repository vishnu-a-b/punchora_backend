import { Request, Response, NextFunction } from "express";

export const roleFindBySlugDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Role']
     #swagger.responses[200] = {
      description: 'Endpoint to get Patient details',
      schema: {
        success: true,
        data: {
            _id: "65cd9d8d5cae5ffc348ed638",
            title: "string",
            slug: "string"
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
