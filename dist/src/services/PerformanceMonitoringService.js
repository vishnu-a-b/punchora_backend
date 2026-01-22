"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const perf_hooks_1 = require("perf_hooks");
const SentryService_1 = __importDefault(require("./SentryService"));
/**
 * Performance Monitoring Service
 *
 * Features:
 * - Query performance tracking
 * - Slow query detection
 * - Request timing
 * - Memory usage monitoring
 * - Performance metrics aggregation
 * - Automatic alerting for performance issues
 */
class PerformanceMonitoringService {
    constructor() {
        this.queries = [];
        this.requests = [];
        this.memorySnapshots = [];
        this.maxMetricsHistory = 1000; // Keep last 1000 metrics
        this.slowQueryThreshold = 100; // ms
        this.memoryMonitoringInterval = null;
        // Start memory monitoring
        this.startMemoryMonitoring();
    }
    /**
     * Track a database query
     */
    trackQuery(options) {
        const isSlowQuery = options.duration > this.slowQueryThreshold;
        const metric = {
            name: options.name,
            query: options.query,
            collection: options.collection,
            duration: options.duration,
            timestamp: Date.now(),
            isSlowQuery,
            metadata: options.metadata,
        };
        this.queries.push(metric);
        this.trimMetrics(this.queries);
        // Log slow queries
        if (isSlowQuery) {
            console.warn(`[Performance] Slow query detected: ${options.name} (${options.duration}ms)\n` +
                `Collection: ${options.collection || 'unknown'}\n` +
                `Query: ${options.query.substring(0, 100)}...`);
            // Send to Sentry
            SentryService_1.default.addBreadcrumb({
                message: `Slow query: ${options.name}`,
                category: 'query',
                level: 'warning',
                data: {
                    duration: options.duration,
                    collection: options.collection,
                    query: options.query.substring(0, 200),
                },
            });
        }
    }
    /**
     * Track a request
     */
    trackRequest(options) {
        const metric = {
            name: options.name,
            method: options.method,
            path: options.path,
            statusCode: options.statusCode,
            duration: options.duration,
            timestamp: Date.now(),
            userId: options.userId,
            metadata: options.metadata,
        };
        this.requests.push(metric);
        this.trimMetrics(this.requests);
        // Log slow requests (> 1s)
        if (options.duration > 1000) {
            console.warn(`[Performance] Slow request: ${options.method} ${options.path} (${options.duration}ms)`);
            SentryService_1.default.addBreadcrumb({
                message: `Slow request: ${options.method} ${options.path}`,
                category: 'http',
                level: 'warning',
                data: {
                    duration: options.duration,
                    statusCode: options.statusCode,
                    userId: options.userId,
                },
            });
        }
    }
    /**
     * Start a performance timer
     */
    startTimer() {
        return perf_hooks_1.performance.now();
    }
    /**
     * End a timer and return duration
     */
    endTimer(startTime) {
        return Math.round(perf_hooks_1.performance.now() - startTime);
    }
    /**
     * Get current memory usage
     */
    getMemoryUsage() {
        const memUsage = process.memoryUsage();
        return {
            timestamp: Date.now(),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024), // MB
        };
    }
    /**
     * Start memory monitoring (every 30 seconds)
     */
    startMemoryMonitoring() {
        this.memoryMonitoringInterval = setInterval(() => {
            const memMetric = this.getMemoryUsage();
            this.memorySnapshots.push(memMetric);
            this.trimMetrics(this.memorySnapshots);
            // Alert on high memory usage (> 512 MB)
            if (memMetric.heapUsed > 512) {
                console.warn(`[Performance] High memory usage: ${memMetric.heapUsed}MB heap used`);
                SentryService_1.default.captureMessage(`High memory usage detected: ${memMetric.heapUsed}MB`, 'warning');
            }
        }, 30000); // Every 30 seconds
    }
    /**
     * Stop memory monitoring
     */
    stopMemoryMonitoring() {
        if (this.memoryMonitoringInterval) {
            clearInterval(this.memoryMonitoringInterval);
            this.memoryMonitoringInterval = null;
        }
    }
    /**
     * Trim metrics array to max size
     */
    trimMetrics(arr) {
        if (arr.length > this.maxMetricsHistory) {
            arr.splice(0, arr.length - this.maxMetricsHistory);
        }
    }
    /**
     * Get slow queries
     */
    getSlowQueries(limit = 20) {
        return this.queries
            .filter(q => q.isSlowQuery)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
    /**
     * Get slow requests
     */
    getSlowRequests(limit = 20) {
        return this.requests
            .filter(r => r.duration > 1000)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
    /**
     * Get query statistics
     */
    getQueryStats() {
        const self = this;
        if (self.queries.length === 0) {
            return {
                total: 0,
                slow: 0,
                avgDuration: 0,
                maxDuration: 0,
                slowQueryPercentage: 0,
            };
        }
        const slow = self.queries.filter(q => q.isSlowQuery).length;
        const totalDuration = self.queries.reduce((sum, q) => sum + q.duration, 0);
        const maxDuration = Math.max(...self.queries.map(q => q.duration));
        return {
            total: self.queries.length,
            slow,
            avgDuration: Math.round(totalDuration / self.queries.length),
            maxDuration: Math.round(maxDuration),
            slowQueryPercentage: Math.round((slow / self.queries.length) * 100),
        };
    }
    /**
     * Get request statistics
     */
    getRequestStats() {
        const self = this;
        if (self.requests.length === 0) {
            return {
                total: 0,
                slow: 0,
                avgDuration: 0,
                maxDuration: 0,
                slowRequestPercentage: 0,
            };
        }
        const slow = self.requests.filter(r => r.duration > 1000).length;
        const totalDuration = self.requests.reduce((sum, r) => sum + r.duration, 0);
        const maxDuration = Math.max(...self.requests.map(r => r.duration));
        return {
            total: self.requests.length,
            slow,
            avgDuration: Math.round(totalDuration / self.requests.length),
            maxDuration: Math.round(maxDuration),
            slowRequestPercentage: Math.round((slow / self.requests.length) * 100),
        };
    }
    /**
     * Get memory statistics
     */
    getMemoryStats() {
        if (this.memorySnapshots.length === 0) {
            return null;
        }
        const current = this.memorySnapshots[this.memorySnapshots.length - 1];
        const avgHeapUsed = Math.round(this.memorySnapshots.reduce((sum, m) => sum + m.heapUsed, 0) /
            this.memorySnapshots.length);
        const avgHeapTotal = Math.round(this.memorySnapshots.reduce((sum, m) => sum + m.heapTotal, 0) /
            this.memorySnapshots.length);
        const avgRss = Math.round(this.memorySnapshots.reduce((sum, m) => sum + m.rss, 0) /
            this.memorySnapshots.length);
        const maxHeapUsed = Math.max(...this.memorySnapshots.map(m => m.heapUsed));
        const maxHeapTotal = Math.max(...this.memorySnapshots.map(m => m.heapTotal));
        const maxRss = Math.max(...this.memorySnapshots.map(m => m.rss));
        return {
            current,
            avg: {
                heapUsed: avgHeapUsed,
                heapTotal: avgHeapTotal,
                rss: avgRss,
            },
            max: {
                heapUsed: maxHeapUsed,
                heapTotal: maxHeapTotal,
                rss: maxRss,
            },
        };
    }
    /**
     * Get all performance metrics
     */
    getAllMetrics() {
        return {
            queries: {
                stats: this.getQueryStats(),
                slowQueries: this.getSlowQueries(10),
            },
            requests: {
                stats: this.getRequestStats(),
                slowRequests: this.getSlowRequests(10),
            },
            memory: this.getMemoryStats(),
        };
    }
    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.queries = [];
        this.requests = [];
        this.memorySnapshots = [];
    }
    /**
     * Set slow query threshold
     */
    setSlowQueryThreshold(ms) {
        this.slowQueryThreshold = ms;
    }
    /**
     * Get slow query threshold
     */
    getSlowQueryThreshold() {
        return this.slowQueryThreshold;
    }
}
// Export singleton instance
const performanceMonitoringService = new PerformanceMonitoringService();
exports.default = performanceMonitoringService;
