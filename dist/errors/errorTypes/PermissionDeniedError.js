"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = __importDefault(require("./CustomError"));
class PermissionDeniedError extends CustomError_1.default {
    constructor({ error, errors }) {
        super("PERMISSION_DENIED");
        this.statusCode = 403;
        this.error = error;
        this.errorsList = errors;
        Object.setPrototypeOf(this, CustomError_1.default.prototype);
    }
}
exports.default = PermissionDeniedError;
