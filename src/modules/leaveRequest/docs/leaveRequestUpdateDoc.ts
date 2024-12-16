import { Request, Response, NextFunction } from "express";

export const leaveRequestUpdateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Leave-Request']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to update a Leave-Request',
            schema: {
              reason: "string",
              leaveDates: ["2024-02-15T05:53:06.960Z"],
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
