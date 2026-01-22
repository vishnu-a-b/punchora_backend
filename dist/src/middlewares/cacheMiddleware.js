"use strict";
/**
 * Cache Middleware
 * Phase 6 Day 1: Automatic response caching
 */
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
exports.cacheMiddleware = cacheMiddleware;
exports.invalidateCacheMiddleware = invalidateCacheMiddleware;
exports.conditionalCacheMiddleware = conditionalCacheMiddleware;
exports.userCacheMiddleware = userCacheMiddleware;
exports.businessCacheMiddleware = businessCacheMiddleware;
exports.cacheControlMiddleware = cacheControlMiddleware;
const CacheService_1 = __importDefault(require("../services/CacheService"));
/**
 * Cache Response Middleware
 * Caches GET requests automatically
 */
function cacheMiddleware(ttl) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        // Skip if cache is disabled
        if (!CacheService_1.default.isEnabled()) {
            return next();
        }
        // Generate cache key from URL and query params
        const cacheKey = generateCacheKey(req);
        try {
            // Try to get cached response
            const cachedResponse = yield CacheService_1.default.get(cacheKey);
            if (cachedResponse) {
                console.log(`📦 Serving from cache: ${cacheKey}`);
                // Add cache hit header
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-Key', cacheKey);
                return res.status(200).json(cachedResponse);
            }
            // Cache miss - continue to route handler
            console.log(`🔍 Cache miss: ${cacheKey}`);
            res.setHeader('X-Cache', 'MISS');
            // Intercept res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    CacheService_1.default.set(cacheKey, body, ttl).catch((error) => {
                        console.error('Error caching response:', error.message);
                    });
                }
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            console.error('Cache middleware error:', error.message);
            // Continue without cache on error
            next();
        }
    });
}
/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
    var _a;
    const user = req.user;
    const userId = ((_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString()) || 'anonymous';
    // Include URL path and query params
    const path = req.path;
    const query = JSON.stringify(req.query);
    return `api:${userId}:${path}:${query}`;
}
/**
 * Cache Invalidation Middleware
 * Automatically invalidates related caches on POST/PUT/DELETE
 */
function invalidateCacheMiddleware(patterns) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        // Only invalidate on mutation methods
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            // Store original send function
            const originalSend = res.send.bind(res);
            res.send = function (body) {
                // Invalidate cache patterns after successful response
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    Promise.all(patterns.map(pattern => CacheService_1.default.delPattern(pattern))).then(results => {
                        const totalDeleted = results.reduce((sum, count) => sum + count, 0);
                        if (totalDeleted > 0) {
                            console.log(`🗑️  Invalidated ${totalDeleted} cache keys`);
                        }
                    }).catch(error => {
                        console.error('Error invalidating cache:', error.message);
                    });
                }
                return originalSend(body);
            };
        }
        next();
    });
}
/**
 * Conditional Cache Middleware
 * Only caches if a condition is met
 */
function conditionalCacheMiddleware(condition, ttl) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (condition(req)) {
            return cacheMiddleware(ttl)(req, res, next);
        }
        next();
    });
}
/**
 * User-specific Cache Middleware
 * Caches responses per user
 */
function userCacheMiddleware(ttl) {
    return cacheMiddleware(ttl);
}
/**
 * Business-scoped Cache Middleware
 * Caches responses per business
 */
function businessCacheMiddleware(ttl) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        // Skip if cache is disabled
        if (!CacheService_1.default.isEnabled()) {
            return next();
        }
        // Get business ID from params or query
        const businessId = req.params.businessId || req.query.businessId;
        if (!businessId) {
            return next();
        }
        // Generate business-scoped cache key
        const path = req.path;
        const query = JSON.stringify(req.query);
        const cacheKey = `business:${businessId}:${path}:${query}`;
        try {
            const cachedResponse = yield CacheService_1.default.get(cacheKey);
            if (cachedResponse) {
                console.log(`📦 Business cache hit: ${cacheKey}`);
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(cachedResponse);
            }
            res.setHeader('X-Cache', 'MISS');
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    CacheService_1.default.set(cacheKey, body, ttl).catch((error) => {
                        console.error('Error caching response:', error.message);
                    });
                }
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            console.error('Business cache middleware error:', error.message);
            next();
        }
    });
}
/**
 * Cache Control Headers Middleware
 * Sets appropriate cache-control headers
 */
function cacheControlMiddleware(maxAge) {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        }
        next();
    };
}
