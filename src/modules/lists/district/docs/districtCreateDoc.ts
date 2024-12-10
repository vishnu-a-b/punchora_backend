import { Request, Response, NextFunction } from "express";

export const districtCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['District']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create a District',
            schema: {
              name: "string"
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
