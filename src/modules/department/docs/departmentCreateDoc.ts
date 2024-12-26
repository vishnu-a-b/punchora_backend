import { Request, Response, NextFunction } from "express";

export const departmentCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Department']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create a Department',
            schema: {
              name: "string",
              business: "string",
              head: "string"
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
