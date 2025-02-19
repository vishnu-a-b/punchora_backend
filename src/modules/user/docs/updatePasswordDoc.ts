import { Request, Response, NextFunction } from "express";

export const updatePasswordDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['User']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to update user password',
            schema: {
              oldPassword: "string",
              newPassword: "string"
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
