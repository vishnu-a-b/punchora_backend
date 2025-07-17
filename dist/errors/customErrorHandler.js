"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = __importDefault(require("./errorTypes/CustomError"));
const customErrorHandler = (error, req, res, next) => {
    if (error instanceof CustomError_1.default) {
        let errorResponse = {
            success: false,
            message: error.message,
        };
        if (error.error) {
            errorResponse.error = error.error;
        }
        if (error.errorsList) {
            errorResponse.errorsList = error.errorsList;
        }
        res.status(error.statusCode).json(errorResponse);
        return;
    }
    res.status(500).json({
        success: false,
        message: "INTERNAL_SERVER_ERROR",
        error: "Something went wrong",
    });
    return;
};
exports.default = customErrorHandler;
