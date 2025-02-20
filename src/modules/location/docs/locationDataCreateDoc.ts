import { Request, Response, NextFunction } from "express";

export const locationDataCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['LocationData']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create an LocationData',
            schema: {
              staff: "string",
              latitude: 10.83,
              longitude: 112.74,
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
