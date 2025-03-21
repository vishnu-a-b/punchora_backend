import { Request, Response, NextFunction } from "express";

export const updateAttendanceDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /*  
          #swagger.tags = ['Attendance']
          #swagger.consumes = ['multipart/form-data']
          #swagger.parameters["staff"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["date"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["checkInTime"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
            #swagger.parameters["checkOutTime"] = {
            "in": "formData",
            "required": false,
            "type": "string"
          }
          #swagger.parameters["checkInPhoto"] = {
            "in": "formData",
            "required": false,
            "type": "file"
          }
            #swagger.parameters["checkOutPhoto"] = {
            "in": "formData",
            "required": false,
            "type": "file"
          }
            #swagger.parameters["sttaus"] = {
            "in": "formData",
            "required": false,
            "type": "string",
            "enum": [ "present", "absent", "leave", "checkedIn"]
          }
          #swagger.security = [
            {
              JWT: []
            }
          ] 
      */
  next();
};
