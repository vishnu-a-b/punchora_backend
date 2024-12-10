import { Request, Response, NextFunction } from "express";

export const hospitalListofAdminDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /* 
     #swagger.tags = ['Hospital']
     #swagger.responses[200] = {
      description: 'Endpoint to get all Hospitals of a hospital admin',
      schema: {
        success: true,
        data: {
          total: 1,
          limit: 10,
          skip: 0,
          items: [
            {
              huid: "string",
              _id: "65cd9d8d5cae5ffc348ed638",
              name: "string",
              address: "string",
              photos: [
                "string"
              ],
              specialities: [
                "string"
              ],
              managementType: "string",
              hospitalType: "string",
              treatmentType: "string",
              numberOfBeds: "number",
              haveEmergency: true,
              contactMobileNumbers: [
                "65cd9d8d5cae8ffc348ed631"
              ],
              contactLandlines: [
                "65cd9d8d5cae8ffc348ed631"
              ],
              isIndependent: false,
              admin: "string",
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
