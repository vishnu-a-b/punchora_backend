import { Request, Response, NextFunction } from "express";

export const jwtVerifyDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
        #swagger.tags = ['Authentication']
        #swagger.parameters['parameter_name'] = {
                in: 'body',
                description: 'Endpoint to verify JWT refresh-token',
                schema: {
                    refreshToken: 'string'
                }
        } 
    */
  next();
};
