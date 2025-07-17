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
exports.businessUpdateDoc = void 0;
const businessUpdateDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
            #swagger.tags = ['Business']
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
              "required": false,
              "type": "string"
            }
            
            #swagger.security = [
              {
                JWT: []
              }
            ]
        */
    next();
});
exports.businessUpdateDoc = businessUpdateDoc;
