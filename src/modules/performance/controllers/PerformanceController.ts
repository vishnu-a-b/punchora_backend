import { Request, Response } from 'express';
import performanceMonitoringService from '../../../services/PerformanceMonitoringService';
import cacheService from '../../../services/CacheService';
import sentryService from '../../../services/SentryService';

/**
 * Performance Metrics Controller
 *
 * Provides endpoints for monitoring system performance
 */
class PerformanceController {
  /**
   * Get all performance metrics
   * GET /api/performance/metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = performanceMonitoringService.getAllMetrics();
      const cacheStats = await cacheService.getStats();

      res.json({
        success: true,
        data: {
          queries: metrics.queries,
          requests: metrics.requests,
          memory: metrics.memory,
          cache: cacheStats,
          sentry: {
            enabled: sentryService.isActive(),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get query performance metrics
   * GET /api/performance/queries
   */
  async getQueryMetrics(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const stats = performanceMonitoringService.getQueryStats();
      const slowQueries = performanceMonitoringService.getSlowQueries(limit);

      res.json({
        success: true,
        data: {
          stats,
          slowQueries,
          threshold: performanceMonitoringService.getSlowQueryThreshold(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve query metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get request performance metrics
   * GET /api/performance/requests
   */
  async getRequestMetrics(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const stats = performanceMonitoringService.getRequestStats();
      const slowRequests = performanceMonitoringService.getSlowRequests(limit);

      res.json({
        success: true,
        data: {
          stats,
          slowRequests,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve request metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get memory usage metrics
   * GET /api/performance/memory
   */
  async getMemoryMetrics(req: Request, res: Response): Promise<void> {
    try {
      const memoryStats = performanceMonitoringService.getMemoryStats();

      res.json({
        success: true,
        data: memoryStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve memory metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get cache statistics
   * GET /api/performance/cache
   */
  async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await cacheService.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cache stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get health check with performance indicators
   * GET /api/performance/health
   */
  async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const memory = performanceMonitoringService.getMemoryUsage();
      const queryStats = performanceMonitoringService.getQueryStats();
      const requestStats = performanceMonitoringService.getRequestStats();
      const cacheStats = await cacheService.getStats();

      // Determine health status
      let status = 'healthy';
      const warnings: string[] = [];

      // Check memory
      if (memory.heapUsed > 512) {
        status = 'degraded';
        warnings.push(`High memory usage: ${memory.heapUsed}MB`);
      }

      // Check slow queries
      if (queryStats.slowQueryPercentage > 20) {
        status = 'degraded';
        warnings.push(`High slow query rate: ${queryStats.slowQueryPercentage}%`);
      }

      // Check slow requests
      if (requestStats.slowRequestPercentage > 10) {
        status = 'degraded';
        warnings.push(`High slow request rate: ${requestStats.slowRequestPercentage}%`);
      }

      res.json({
        success: true,
        status,
        warnings: warnings.length > 0 ? warnings : undefined,
        data: {
          memory,
          queries: {
            total: queryStats.total,
            slow: queryStats.slow,
            avgDuration: queryStats.avgDuration,
          },
          requests: {
            total: requestStats.total,
            slow: requestStats.slow,
            avgDuration: requestStats.avgDuration,
          },
          cache: {
            enabled: cacheStats.enabled,
            connected: cacheStats.connected,
          },
          monitoring: {
            sentry: sentryService.isActive(),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Clear performance metrics
   * POST /api/performance/clear
   */
  async clearMetrics(req: Request, res: Response): Promise<void> {
    try {
      performanceMonitoringService.clearMetrics();

      res.json({
        success: true,
        message: 'Performance metrics cleared',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to clear metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Set slow query threshold
   * POST /api/performance/threshold
   */
  async setSlowQueryThreshold(req: Request, res: Response): Promise<void> {
    try {
      const { threshold } = req.body;

      if (!threshold || typeof threshold !== 'number' || threshold < 1) {
        res.status(400).json({
          success: false,
          message: 'Invalid threshold value. Must be a positive number.',
        });
        return;
      }

      performanceMonitoringService.setSlowQueryThreshold(threshold);

      res.json({
        success: true,
        message: `Slow query threshold set to ${threshold}ms`,
        data: {
          threshold,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to set threshold',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Flush cache
   * POST /api/performance/cache/flush
   */
  async flushCache(req: Request, res: Response): Promise<void> {
    try {
      const { pattern } = req.body;

      if (pattern) {
        const count = await cacheService.delPattern(pattern);
        res.json({
          success: true,
          message: `Deleted ${count} keys matching pattern: ${pattern}`,
          data: { deletedKeys: count, pattern },
          timestamp: new Date().toISOString(),
        });
      } else {
        await cacheService.flush();
        res.json({
          success: true,
          message: 'Cache flushed completely',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to flush cache',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new PerformanceController();
