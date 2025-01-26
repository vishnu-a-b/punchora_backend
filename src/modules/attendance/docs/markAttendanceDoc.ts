import { Request, Response, NextFunction } from "express";

export const markAttendanceDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
          /*  
          #swagger.tags = ['Attendance']
          #swagger.consumes = ['multipart/form-data']
          #swagger.parameters["date"] = {
            "in": "formData",
            "required": true,
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
          #swagger.parameters["photo"] = {
            "in": "formData",
            "required": true,
            "type": "file"
          }
          #swagger.security = [
            {
              JWT: []
            }
          ] 
      */
  next();
};
