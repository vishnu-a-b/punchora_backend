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
exports.userDetailsDoc = void 0;
const userDetailsDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
       #swagger.tags = ['Account']
       #swagger.responses[200] = {
        description: 'Endpoint to the details of a User using his jwt token',
        schema: {
          success: true,
          data: {
            _id: "65cd9d8d5cae5ffc348ed638",
            name: "string",
            mobileNo: "string",
            photo: "string",
            gender: "string",
            maritalStatus: "string",
            roles: [
              {
                _id: "65cd9d8d5cae5ffc148ed631",
                title: "string",
                slug: "string"
              }
            ],
            isActive: true,
            isSuperAdmin: false,
            createdAt: "2024-02-15T05:53:06.960Z",
            updatedAt: "2024-02-15T05:53:06.960Z"
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
});
exports.userDetailsDoc = userDetailsDoc;
