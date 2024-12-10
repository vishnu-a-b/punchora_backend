import { Request, Response, NextFunction } from "express";

export const departmentDetailsDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Department']
     #swagger.responses[200] = {
      description: 'Endpoint to the details of a Department',
      schema: {
        success: true,
        data: {
            _id: "65cd9d8d5cae5ffc348ed638",
            name: "string",
            hospital: "string",
            head: "string",
            createdAt: "2024-02-15T05:53:06.960Z",
            updatedAt: "2024-02-15T05:53:06.960Z",
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
