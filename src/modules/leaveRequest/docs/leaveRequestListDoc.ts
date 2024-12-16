import { Request, Response, NextFunction } from "express";

export const leaveRequestListDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Leave-Request']
     #swagger.responses[200] = {
      description: 'Endpoint to get all Leave requests',
      schema: {
        success: true,
        data: {
          total: 1,
          limit: 10,
          skip: 0,
          items: [
            {
              _id: "65cd9d8d5cae5ffc348ed638",
              reason: "string",
              staff: "string",
              department: "string",
              leaveDates: ["2024-02-15T05:53:06.960Z"],
              remarks: "string",
              status: "string",
              createdAt: "2024-02-15T05:53:06.960Z",
              updatedAt: "2024-02-15T05:53:06.960Z",
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
