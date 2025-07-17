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
exports.addressDetailsDoc = void 0;
const addressDetailsDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
       #swagger.tags = ['Address']
       #swagger.responses[200] = {
        description: 'Endpoint to get Address details',
        schema: {
          success: true,
          data: {
            _id: "65cd9d8d5cae5ffc348ed638",
            address: "string",
            thaluk: "string",
            district: "string",
            pinCode: "string",
            latitude: 314,
            longitude: 1.22,
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
exports.addressDetailsDoc = addressDetailsDoc;
