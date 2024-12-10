import { Request, Response, NextFunction } from "express";

export const specialityCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Speciality']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create a Speciality',
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
