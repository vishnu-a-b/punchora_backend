import { Request, Response, NextFunction } from 'express';
import performanceMonitoringService from '../services/PerformanceMonitoringService';

/**
 * Performance tracking middleware
 *
 * Tracks request duration and logs slow requests
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performanceMonitoringService.startTimer();

  // Store original end function
  const originalEnd = res.end.bind(res);

  // Override end function to capture metrics
  res.end = function (this: Response, cb?: any): Response {
    // Restore original end
    res.end = originalEnd;

    // Calculate duration
    const duration = performanceMonitoringService.endTimer(startTime);

    // Get user from request if available
    const userId = (req as any).user?.id || (req as any).user?._id?.toString();

    // Track the request
    performanceMonitoringService.trackRequest({
      name: `${req.method} ${req.path}`,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId,
      metadata: {
        query: req.query,
        params: req.params,
      },
    });

    // Add custom headers
    res.setHeader('X-Response-Time', `${duration}ms`);

    // Call original end
    return originalEnd(cb) as Response;
  } as any;

  next();
};

/**
 * Mongoose query monitoring plugin
 *
 * Add this to your mongoose schemas to track query performance
 *
 * Usage:
 * ```typescript
 * import { mongooseQueryMonitor } from './middlewares/performanceMiddleware';
 * schema.plugin(mongooseQueryMonitor);
 * ```
 */
export const mongooseQueryMonitor = (schema: any) => {
  // Track find queries
  schema.pre('find', function (this: any) {
    this._startTime = performanceMonitoringService.startTimer();
  });

  schema.post('find', function (this: any, docs: any) {
    if (this._startTime) {
      const duration = performanceMonitoringService.endTimer(this._startTime);

      performanceMonitoringService.trackQuery({
        name: 'find',
        query: JSON.stringify(this.getQuery()),
        collection: this.mongooseCollection?.name,
        duration,
        metadata: {
          resultCount: docs?.length || 0,
        },
      });
    }
  });

  // Track findOne queries
  schema.pre('findOne', function (this: any) {
    this._startTime = performanceMonitoringService.startTimer();
  });

  schema.post('findOne', function (this: any) {
    if (this._startTime) {
      const duration = performanceMonitoringService.endTimer(this._startTime);

      performanceMonitoringService.trackQuery({
        name: 'findOne',
        query: JSON.stringify(this.getQuery()),
        collection: this.mongooseCollection?.name,
        duration,
      });
    }
  });

  // Track save operations
  schema.pre('save', function (this: any) {
    this._startTime = performanceMonitoringService.startTimer();
  });

  schema.post('save', function (this: any) {
    if (this._startTime) {
      const duration = performanceMonitoringService.endTimer(this._startTime);

      performanceMonitoringService.trackQuery({
        name: 'save',
        query: 'save',
        collection: this.constructor.collection?.name,
        duration,
      });
    }
  });

  // Track update queries
  schema.pre('updateOne', function (this: any) {
    this._startTime = performanceMonitoringService.startTimer();
  });

  schema.post('updateOne', function (this: any) {
    if (this._startTime) {
      const duration = performanceMonitoringService.endTimer(this._startTime);

      performanceMonitoringService.trackQuery({
        name: 'updateOne',
        query: JSON.stringify(this.getQuery()),
        collection: this.mongooseCollection?.name,
        duration,
      });
    }
  });

  // Track deleteOne queries
  schema.pre('deleteOne', function (this: any) {
    this._startTime = performanceMonitoringService.startTimer();
  });

  schema.post('deleteOne', function (this: any) {
    if (this._startTime) {
      const duration = performanceMonitoringService.endTimer(this._startTime);

      performanceMonitoringService.trackQuery({
        name: 'deleteOne',
        query: JSON.stringify(this.getQuery()),
        collection: this.mongooseCollection?.name,
        duration,
      });
    }
  });

  // Track aggregate queries
  schema.pre('aggregate', function (this: any) {
    this._startTime = performanceMonitoringService.startTimer();
  });

  schema.post('aggregate', function (this: any, docs: any) {
    if (this._startTime) {
      const duration = performanceMonitoringService.endTimer(this._startTime);

      performanceMonitoringService.trackQuery({
        name: 'aggregate',
        query: 'aggregate',
        collection: this.mongooseCollection?.name,
        duration,
        metadata: {
          resultCount: docs?.length || 0,
        },
      });
    }
  });
};

/**
 * Manual query tracker helper
 *
 * Use this to manually track queries
 *
 * Usage:
 * ```typescript
 * import { trackQuery } from './middlewares/performanceMiddleware';
 *
 * const result = await trackQuery(
 *   'Complex aggregation',
 *   'Staff',
 *   async () => {
 *     return await Staff.aggregate([...]);
 *   }
 * );
 * ```
 */
export async function trackQuery<T>(
  name: string,
  collection: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = performanceMonitoringService.startTimer();

  try {
    const result = await queryFn();
    const duration = performanceMonitoringService.endTimer(startTime);

    performanceMonitoringService.trackQuery({
      name,
      query: name,
      collection,
      duration,
    });

    return result;
  } catch (error) {
    const duration = performanceMonitoringService.endTimer(startTime);

    performanceMonitoringService.trackQuery({
      name: `${name} (error)`,
      query: name,
      collection,
      duration,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}
