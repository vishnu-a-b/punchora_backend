import { Request, Response, NextFunction } from "express";

export const userUpdateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['User']
          #swagger.consumes = ['multipart/form-data']
          #swagger.parameters["name"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["mobileNo"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["password"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["email"] = {
            "in": "formData",
            "required": false,
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
          
          #swagger.parameters["dateOfBirth"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["gender"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["maritalStatus"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "Unknown", "Bachelor", "Married", "Widower", "Divorced"]
          }
          #swagger.parameters["roles[]"] = {
            "in": "formData",
            "required": false,
            "type": "array",
            "items": {
              "type": "string",
            }
          }
          #swagger.parameters["isActive"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "true", "false"]
          }
          
          #swagger.security = [
            {
              JWT: []
            }
          ] 
      */
  next();
};
