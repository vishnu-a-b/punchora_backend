import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log directory
const logDir = path.join(__dirname, '../../logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Error logs - daily rotation, kept for 3 days
const errorLogTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '3d', // Keep for 3 days
  format: logFormat,
  zippedArchive: true, // Compress old logs
});

// Combined logs (all levels) - daily rotation, kept for 3 days
const combinedLogTransport = new DailyRotateFile({
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '3d', // Keep for 3 days
  format: logFormat,
  zippedArchive: true, // Compress old logs
});

// HTTP request logs - daily rotation, kept for 3 days
const httpLogTransport = new DailyRotateFile({
  filename: path.join(logDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '3d', // Keep for 3 days
  format: logFormat,
  zippedArchive: true,
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    errorLogTransport,
    combinedLogTransport,
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '3d',
      format: logFormat,
      zippedArchive: true,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
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
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// HTTP request logger (separate logger for clarity)
export const httpLogger = winston.createLogger({
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

export default logger;
