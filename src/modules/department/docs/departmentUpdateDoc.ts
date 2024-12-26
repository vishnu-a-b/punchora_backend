import { Request, Response, NextFunction } from "express";

export const departmentUpdateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Department']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to update an Department',
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
