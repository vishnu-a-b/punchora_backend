import { Request, Response, NextFunction } from "express";

export const jwtCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
        #swagger.tags = ['Authentication']
        #swagger.parameters['parameter_name'] = {
                in: 'body',
                description: 'Endpoint to create JWT tokens',
                schema: {
                    username: 'string',
                    password: 'string'
                }
        } 
    */
  next();
};
