import { Request, Response, NextFunction } from 'express';
import { httpLogger } from '../utils/logger';

/**
 * Middleware to log HTTP requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?._id || 'anonymous',
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      httpLogger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      httpLogger.warn('HTTP Request Warning', logData);
    } else {
      httpLogger.info('HTTP Request', logData);
    }
  });

  next();
};
