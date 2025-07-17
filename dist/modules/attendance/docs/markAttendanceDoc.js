"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAttendanceDoc = void 0;
const markAttendanceDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.markAttendanceDoc = markAttendanceDoc;
