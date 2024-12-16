import { Request, Response, NextFunction } from "express";

export const addressCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Address']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create an Address',
            schema: {
              address: "string",
              taluk: "string",
              district: "string",
              pinCode: "string",
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
