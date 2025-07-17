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
exports.vcLinkUpdateDoc = void 0;
const vcLinkUpdateDoc = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    /*
            #swagger.tags = ['Business']
            #swagger.parameters['parameter_name'] = {
              in: 'body',
              description: 'Endpoint to update vc link',
              schema: {
                vcLink: "string"
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
exports.vcLinkUpdateDoc = vcLinkUpdateDoc;
