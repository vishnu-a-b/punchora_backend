import { Request, Response, NextFunction } from "express";

export const staffUpdateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Staff']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to update a Staff',
            schema: {
              schema: {
              name: "string",
              department: "65cd9d8d5cae5ffc348ed638",
              business: "65cd9d8d5cae5ffc348ed638",
              roles: "string",
              joinDate: "string",
            }
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
