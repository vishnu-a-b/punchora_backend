import { Request, Response, NextFunction } from "express";

export const markAttendanceDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Attendance']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to mark Attendance',
            schema: {
              name: "string",
              staff: "65cd9d8d5cae5ffc348ed638",
              date: "string",
              checkInTime: "string",
              checkOutTime: "string",              
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
