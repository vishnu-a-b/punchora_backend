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
exports.locationDataListDoc = void 0;
const locationDataListDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
       #swagger.tags = ['LocationData']
       #swagger.responses[200] = {
        description: 'Endpoint to get Location Data',
        schema: {
          success: true,
          data: [{
                _id: "65cd9d8d5cae5ffc348ed638",
                staff: "65cd9d8d5cae5ffc348ed638",
                checkInTime: 231323,
                checkOutTime: 1232131.3,
                createdBy: "65cd9d8d5cae4ffc348ed682",
                createdAt: "2024-02-17T07:50:12.025Z",
                updatedAt: "2024-02-17T07:50:12.025Z",
              }]
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
exports.locationDataListDoc = locationDataListDoc;
