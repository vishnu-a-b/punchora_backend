import { Request, Response, NextFunction } from "express";

export const businessCreateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Business']
          #swagger.consumes = ['multipart/form-data']
          #swagger.parameters["name"] = {
            "in": "formData",
            "required": true,
            "type": "string"
          }
          #swagger.parameters["address"] = {
            "in": "formData",
            "required": true,
            "type": "string"
          }
          #swagger.parameters["photos"] = {
            "in": "formData",
            "required": false,
            "type": "array",
            "items": {
              "type": "file",
            }
          }

          #swagger.parameters["managementType"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "Unknown", "Government", "Cooperative", "Private"]
          }
          #swagger.parameters["contactMobileNumbers[]"] = {
            "in": "formData",
            "required": false,
            "type": "array",
            "items": {
              "type": "string",
            }
          }
           #swagger.parameters["contactLandlines[]"] = {
            "in": "formData",
            "required": false,
            "type": "array",
            "items": {
              "type": "string",
            }
          }
          #swagger.parameters["vcLink"] = {
            "in": "formData",
            "type": "string"
          }
          #swagger.parameters["admin"] = {
            "in": "formData",
            "required": true,
            "type": "string"
          }
          
          #swagger.security = [
            {
              JWT: []
            }
          ] 
      */
  next();
};
