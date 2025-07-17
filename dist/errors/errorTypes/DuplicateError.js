"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = __importDefault(require("./CustomError"));
class DuplicateError extends CustomError_1.default {
    constructor({ error, errors }) {
        super("DUPLICATE_VALUE");
        this.statusCode = 409;
        this.error = error;
        this.errorsList = errors;
        Object.setPrototypeOf(this, CustomError_1.default.prototype);
    }
}
exports.default = DuplicateError;
