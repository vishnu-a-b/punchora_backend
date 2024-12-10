import { Request, Response, NextFunction } from "express";

export const attendanceListDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Attendance']
     #swagger.responses[200] = {
      description: 'Endpoint to get Attendance list of a staff',
      schema: {
        success: true,
        data: [{
              _id: "65cd9d8d5cae5ffc348ed638",
              staff: "65cd9d8d5cae5ffc348ed638",
              date: "string",
              checkInTime: "string",
              checkOutTime: "string",
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
