import { Request, Response, NextFunction } from "express";

export const vcLinkUpdateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Hospital']
          #swagger.parameters['parameter_name'] = {
            in: 'body',
            description: 'Endpoint to update vc link',
            schema: {
              vcLink: "string"
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
