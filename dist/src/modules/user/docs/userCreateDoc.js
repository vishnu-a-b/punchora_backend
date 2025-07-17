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
exports.userCreateDoc = void 0;
const userCreateDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
            #swagger.tags = ['User']
            #swagger.consumes = ['multipart/form-data']
            #swagger.parameters["name"] = {
              "in": "formData",
              "required": true,
              "type": "string"
            }
            #swagger.parameters["mobileNo"] = {
              "in": "formData",
              "required": true,
              "type": "string"
            }
            #swagger.parameters["email"] = {
              "in": "formData",
              "required": false,
              "type": "string"
            }
            #swagger.parameters["password"] = {
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
            #swagger.parameters["dateOfBirth"] = {
              "in": "formData",
              "required": false,
              "type": "string"
            }
            #swagger.parameters["gender"] = {
              "in": "formData",
              "required": true,
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
});
exports.userCreateDoc = userCreateDoc;
