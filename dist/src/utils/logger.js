"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
// Define log directory
const logDir = path_1.default.join(__dirname, '../../logs');
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Custom format for console output
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
}));
// Error logs - daily rotation, kept for 3 days
const errorLogTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '3d', // Keep for 3 days
    format: logFormat,
    zippedArchive: true, // Compress old logs
});
// Combined logs (all levels) - daily rotation, kept for 3 days
const combinedLogTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '3d', // Keep for 3 days
    format: logFormat,
    zippedArchive: true, // Compress old logs
});
// HTTP request logs - daily rotation, kept for 3 days
const httpLogTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '3d', // Keep for 3 days
    format: logFormat,
    zippedArchive: true,
});
// Create the logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        errorLogTransport,
        combinedLogTransport,
    ],
    exceptionHandlers: [
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '3d',
            format: logFormat,
            zippedArchive: true,
        }),
    ],
    rejectionHandlers: [
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '3d',
            format: logFormat,
            zippedArchive: true,
        }),
    ],
});
// Add console output in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
// HTTP request logger (separate logger for clarity)
exports.httpLogger = winston_1.default.createLogger({
    level: 'info',
    format: logFormat,
    transports: [httpLogTransport],
});
// Event listeners for rotation
errorLogTransport.on('rotate', (oldFilename, newFilename) => {
    logger.info(`Error log rotated from ${oldFilename} to ${newFilename}`);
});
combinedLogTransport.on('rotate', (oldFilename, newFilename) => {
    logger.info(`Combined log rotated from ${oldFilename} to ${newFilename}`);
});
exports.default = logger;
