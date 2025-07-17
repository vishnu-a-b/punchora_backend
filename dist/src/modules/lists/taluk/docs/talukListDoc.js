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
exports.talukListDoc = void 0;
const talukListDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
       #swagger.tags = ['Taluk']
       #swagger.responses[200] = {
        description: 'Endpoint to get all Taluks',
        schema: {
          success: true,
          data: {
            total: 1,
            limit: 10,
            skip: 0,
            items: [
              {
                _id: "65cd9d8d5cae5ffc348ed638",
                name: "string",
                district: "65cd9d8d5cae4ffc348ed698"
              }
            ]
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
exports.talukListDoc = talukListDoc;
