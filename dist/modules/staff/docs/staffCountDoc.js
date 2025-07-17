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
exports.staffCountDoc = void 0;
const staffCountDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
      #swagger.tags = ['Staff']
      #swagger.responses[200] = {
        description: 'Endpoint to get total Staffs count',
      }
      #swagger.security = [
        {
          JWT: []
        }
      ]
    */
    next();
});
exports.staffCountDoc = staffCountDoc;
