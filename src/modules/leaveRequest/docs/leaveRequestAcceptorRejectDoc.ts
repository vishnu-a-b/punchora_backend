import { Request, Response, NextFunction } from "express";

export const leaveRequestAcceptorRejectDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Leave-Request']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to accept or reject Leave-Request',
            schema: {
              status: "string",
              remarks: "string",
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
