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
exports.mongooseQueryMonitor = exports.performanceMiddleware = void 0;
exports.trackQuery = trackQuery;
const PerformanceMonitoringService_1 = __importDefault(require("../services/PerformanceMonitoringService"));
/**
 * Performance tracking middleware
 *
 * Tracks request duration and logs slow requests
 */
const performanceMiddleware = (req, res, next) => {
    const startTime = PerformanceMonitoringService_1.default.startTimer();
    // Store original end function
    const originalEnd = res.end.bind(res);
    // Override end function to capture metrics
    res.end = function (cb) {
        var _a, _b, _c;
        // Restore original end
        res.end = originalEnd;
        // Calculate duration
        const duration = PerformanceMonitoringService_1.default.endTimer(startTime);
        // Get user from request if available
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString());
        // Track the request
        PerformanceMonitoringService_1.default.trackRequest({
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
        return originalEnd(cb);
    };
    next();
};
exports.performanceMiddleware = performanceMiddleware;
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
const mongooseQueryMonitor = (schema) => {
    // Track find queries
    schema.pre('find', function () {
        this._startTime = PerformanceMonitoringService_1.default.startTimer();
    });
    schema.post('find', function (docs) {
        var _a;
        if (this._startTime) {
            const duration = PerformanceMonitoringService_1.default.endTimer(this._startTime);
            PerformanceMonitoringService_1.default.trackQuery({
                name: 'find',
                query: JSON.stringify(this.getQuery()),
                collection: (_a = this.mongooseCollection) === null || _a === void 0 ? void 0 : _a.name,
                duration,
                metadata: {
                    resultCount: (docs === null || docs === void 0 ? void 0 : docs.length) || 0,
                },
            });
        }
    });
    // Track findOne queries
    schema.pre('findOne', function () {
        this._startTime = PerformanceMonitoringService_1.default.startTimer();
    });
    schema.post('findOne', function () {
        var _a;
        if (this._startTime) {
            const duration = PerformanceMonitoringService_1.default.endTimer(this._startTime);
            PerformanceMonitoringService_1.default.trackQuery({
                name: 'findOne',
                query: JSON.stringify(this.getQuery()),
                collection: (_a = this.mongooseCollection) === null || _a === void 0 ? void 0 : _a.name,
                duration,
            });
        }
    });
    // Track save operations
    schema.pre('save', function () {
        this._startTime = PerformanceMonitoringService_1.default.startTimer();
    });
    schema.post('save', function () {
        var _a;
        if (this._startTime) {
            const duration = PerformanceMonitoringService_1.default.endTimer(this._startTime);
            PerformanceMonitoringService_1.default.trackQuery({
                name: 'save',
                query: 'save',
                collection: (_a = this.constructor.collection) === null || _a === void 0 ? void 0 : _a.name,
                duration,
            });
        }
    });
    // Track update queries
    schema.pre('updateOne', function () {
        this._startTime = PerformanceMonitoringService_1.default.startTimer();
    });
    schema.post('updateOne', function () {
        var _a;
        if (this._startTime) {
            const duration = PerformanceMonitoringService_1.default.endTimer(this._startTime);
            PerformanceMonitoringService_1.default.trackQuery({
                name: 'updateOne',
                query: JSON.stringify(this.getQuery()),
                collection: (_a = this.mongooseCollection) === null || _a === void 0 ? void 0 : _a.name,
                duration,
            });
        }
    });
    // Track deleteOne queries
    schema.pre('deleteOne', function () {
        this._startTime = PerformanceMonitoringService_1.default.startTimer();
    });
    schema.post('deleteOne', function () {
        var _a;
        if (this._startTime) {
            const duration = PerformanceMonitoringService_1.default.endTimer(this._startTime);
            PerformanceMonitoringService_1.default.trackQuery({
                name: 'deleteOne',
                query: JSON.stringify(this.getQuery()),
                collection: (_a = this.mongooseCollection) === null || _a === void 0 ? void 0 : _a.name,
                duration,
            });
        }
    });
    // Track aggregate queries
    schema.pre('aggregate', function () {
        this._startTime = PerformanceMonitoringService_1.default.startTimer();
    });
    schema.post('aggregate', function (docs) {
        var _a;
        if (this._startTime) {
            const duration = PerformanceMonitoringService_1.default.endTimer(this._startTime);
            PerformanceMonitoringService_1.default.trackQuery({
                name: 'aggregate',
                query: 'aggregate',
                collection: (_a = this.mongooseCollection) === null || _a === void 0 ? void 0 : _a.name,
                duration,
                metadata: {
                    resultCount: (docs === null || docs === void 0 ? void 0 : docs.length) || 0,
                },
            });
        }
    });
};
exports.mongooseQueryMonitor = mongooseQueryMonitor;
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
function trackQuery(name, collection, queryFn) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = PerformanceMonitoringService_1.default.startTimer();
        try {
            const result = yield queryFn();
            const duration = PerformanceMonitoringService_1.default.endTimer(startTime);
            PerformanceMonitoringService_1.default.trackQuery({
                name,
                query: name,
                collection,
                duration,
            });
            return result;
        }
        catch (error) {
            const duration = PerformanceMonitoringService_1.default.endTimer(startTime);
            PerformanceMonitoringService_1.default.trackQuery({
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
    });
}
