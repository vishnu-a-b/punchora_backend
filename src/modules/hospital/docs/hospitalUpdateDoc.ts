import { Request, Response, NextFunction } from "express";

export const hospitalUpdateDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Hospital']
          #swagger.consumes = ['multipart/form-data']
          #swagger.parameters["name"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["address"] = {
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
          #swagger.parameters["specialities[]"] = {
            "in": "formData",
            "required": false,
            "type": "array",
            "items": {
              "type": "string",
            }
          }
          #swagger.parameters["managementType"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "Unknown", "Government", "Cooperative", "Mission", "Private"]
          }
           #swagger.parameters["hospitalType"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "Unknown", "Medical College", "Super Speciality", "High End", "Medium", "Nursing Home", "Clinic"]
          }
           #swagger.parameters["treatmentType"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "Unknown", "Modern Medicine", "Homiopathy", "Ayurveda", "Sidha", "Physio Therapy"]
          }
          #swagger.parameters["numberOfBeds"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["haveEmergency"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "true", "false"]
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
          #swagger.parameters["isIndependent"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "true", "false"]
          }
          #swagger.parameters["vcLink"] = {
            "in": "formData",
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
