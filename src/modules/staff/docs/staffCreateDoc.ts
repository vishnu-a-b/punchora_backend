import { Request, Response, NextFunction } from "express";

export const staffCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Staff']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to create a Staff',
            schema: {
              name: "string",
              user: "65cd9d8d5cae5ffc348ed638",
              department: "65cd9d8d5cae5ffc348ed638",
              business: "65cd9d8d5cae5ffc348ed638",
              roles: "string",
              joinDate: "string",
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
