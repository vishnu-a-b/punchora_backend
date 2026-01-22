"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
/**
 * Middleware to log HTTP requests
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    // Log when response finishes
    res.on('finish', () => {
        var _a;
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || 'anonymous',
        };
        // Log based on status code
        if (res.statusCode >= 500) {
            logger_1.httpLogger.error('HTTP Request Error', logData);
        }
        else if (res.statusCode >= 400) {
            logger_1.httpLogger.warn('HTTP Request Warning', logData);
        }
        else {
            logger_1.httpLogger.info('HTTP Request', logData);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
