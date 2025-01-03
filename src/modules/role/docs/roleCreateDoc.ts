import { Request, Response, NextFunction } from "express";

export const roleCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Role']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create a Role',
            schema: {
              title: "string",
              slug: "string"
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
