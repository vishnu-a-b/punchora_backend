"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = __importDefault(require("./errorTypes/CustomError"));
const logger_1 = __importDefault(require("../utils/logger"));
const customErrorHandler = (error, req, res, next) => {
    var _a;
    // Log error details
    const errorContext = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || 'anonymous',
        body: req.body,
        params: req.params,
        query: req.query,
    };
    if (error instanceof CustomError_1.default) {
        // Log custom errors as warnings (these are expected errors)
        logger_1.default.warn('Custom Error', Object.assign(Object.assign({}, errorContext), { statusCode: error.statusCode, message: error.message, error: error.error, errorsList: error.errorsList, stack: error.stack }));
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
    // Log unexpected errors as errors
    logger_1.default.error('Unhandled Error', Object.assign(Object.assign({}, errorContext), { message: error.message, stack: error.stack, name: error.name }));
    res.status(500).json({
        success: false,
        message: "INTERNAL_SERVER_ERROR",
        error: "Something went wrong",
    });
    return;
};
exports.default = customErrorHandler;
