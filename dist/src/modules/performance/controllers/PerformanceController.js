"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PerformanceMonitoringService_1 = __importDefault(require("../../../services/PerformanceMonitoringService"));
const CacheService_1 = __importDefault(require("../../../services/CacheService"));
const SentryService_1 = __importDefault(require("../../../services/SentryService"));
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
    getMetrics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const metrics = PerformanceMonitoringService_1.default.getAllMetrics();
                const cacheStats = yield CacheService_1.default.getStats();
                res.json({
                    success: true,
                    data: {
                        queries: metrics.queries,
                        requests: metrics.requests,
                        memory: metrics.memory,
                        cache: cacheStats,
                        sentry: {
                            enabled: SentryService_1.default.isActive(),
                        },
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve performance metrics',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Get query performance metrics
     * GET /api/performance/queries
     */
    getQueryMetrics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = parseInt(req.query.limit) || 20;
                const stats = PerformanceMonitoringService_1.default.getQueryStats();
                const slowQueries = PerformanceMonitoringService_1.default.getSlowQueries(limit);
                res.json({
                    success: true,
                    data: {
                        stats,
                        slowQueries,
                        threshold: PerformanceMonitoringService_1.default.getSlowQueryThreshold(),
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve query metrics',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Get request performance metrics
     * GET /api/performance/requests
     */
    getRequestMetrics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = parseInt(req.query.limit) || 20;
                const stats = PerformanceMonitoringService_1.default.getRequestStats();
                const slowRequests = PerformanceMonitoringService_1.default.getSlowRequests(limit);
                res.json({
                    success: true,
                    data: {
                        stats,
                        slowRequests,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve request metrics',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Get memory usage metrics
     * GET /api/performance/memory
     */
    getMemoryMetrics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const memoryStats = PerformanceMonitoringService_1.default.getMemoryStats();
                res.json({
                    success: true,
                    data: memoryStats,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve memory metrics',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Get cache statistics
     * GET /api/performance/cache
     */
    getCacheStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield CacheService_1.default.getStats();
                res.json({
                    success: true,
                    data: stats,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve cache stats',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Get health check with performance indicators
     * GET /api/performance/health
     */
    getHealthCheck(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const memory = PerformanceMonitoringService_1.default.getMemoryUsage();
                const queryStats = PerformanceMonitoringService_1.default.getQueryStats();
                const requestStats = PerformanceMonitoringService_1.default.getRequestStats();
                const cacheStats = yield CacheService_1.default.getStats();
                // Determine health status
                let status = 'healthy';
                const warnings = [];
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
                            sentry: SentryService_1.default.isActive(),
                        },
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    status: 'unhealthy',
                    message: 'Health check failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Clear performance metrics
     * POST /api/performance/clear
     */
    clearMetrics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                PerformanceMonitoringService_1.default.clearMetrics();
                res.json({
                    success: true,
                    message: 'Performance metrics cleared',
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to clear metrics',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Set slow query threshold
     * POST /api/performance/threshold
     */
    setSlowQueryThreshold(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { threshold } = req.body;
                if (!threshold || typeof threshold !== 'number' || threshold < 1) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid threshold value. Must be a positive number.',
                    });
                    return;
                }
                PerformanceMonitoringService_1.default.setSlowQueryThreshold(threshold);
                res.json({
                    success: true,
                    message: `Slow query threshold set to ${threshold}ms`,
                    data: {
                        threshold,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to set threshold',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Flush cache
     * POST /api/performance/cache/flush
     */
    flushCache(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { pattern } = req.body;
                if (pattern) {
                    const count = yield CacheService_1.default.delPattern(pattern);
                    res.json({
                        success: true,
                        message: `Deleted ${count} keys matching pattern: ${pattern}`,
                        data: { deletedKeys: count, pattern },
                        timestamp: new Date().toISOString(),
                    });
                }
                else {
                    yield CacheService_1.default.flush();
                    res.json({
                        success: true,
                        message: 'Cache flushed completely',
                        timestamp: new Date().toISOString(),
                    });
                }
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to flush cache',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
}
exports.default = new PerformanceController();
