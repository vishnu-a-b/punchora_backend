import { Request, Response, NextFunction } from "express";

export const talukCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Taluk']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create a Taluk',
            schema: {
              name: "string",
              district: "65cd9d8d5cae4ffc348ed698"
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
