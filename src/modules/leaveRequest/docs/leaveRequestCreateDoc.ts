import { Request, Response, NextFunction } from "express";

export const leaveRequestCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Leave-Request']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create Leave-Request',
            schema: {
              reason: "string",
              staff: "string",
              department: "string",
              leaveDates: ["2024-02-15T05:53:06.960Z"],
              remarks: "string",
              status: "string",
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
