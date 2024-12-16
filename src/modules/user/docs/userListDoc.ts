import { Request, Response, NextFunction } from "express";

export const userListDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['User']
     #swagger.responses[200] = {
      description: 'Endpoint to get all Users',
      schema: {
        success: true,
        data: {
          total: 1,
          limit: 10,
          skip: 0,
          items: [
            {
              _id: "65cd9d8d5cae5ffc348ed638",
              name: "string",
              mobileNo: "string",
              photo: "string",
              gender: "string",
              maritalStatus: "string",
              roles: [
                "65cd9d8d5cae8ffc348ed631"
              ],
              isActive: true,
              isSuperAdmin: false,
              createdAt: "2024-02-15T05:53:06.960Z",
              updatedAt: "2024-02-15T05:53:06.960Z",
            }
          ]
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
