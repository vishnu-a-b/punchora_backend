"use strict";
/**
 * Cache Service
 * Phase 6 Day 1: Redis caching layer for performance optimization
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
exports.CacheTTL = exports.CacheKeys = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Cache Service with Redis
 * Provides caching with automatic graceful degradation if Redis is unavailable
 */
class CacheService {
    constructor() {
        this.redis = null;
        this.enabled = false;
        this.DEFAULT_TTL = 300; // 5 minutes
        this.initialize();
    }
    /**
     * Initialize Redis connection
     */
    initialize() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.redis = new ioredis_1.default(redisUrl, {
                retryStrategy: (times) => {
                    // Retry up to 3 times
                    if (times > 3) {
                        console.warn('⚠️  Redis connection failed after 3 retries. Operating without cache.');
                        return null;
                    }
                    return Math.min(times * 100, 3000);
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true
            });
            // Connect to Redis
            this.redis.connect()
                .then(() => {
                this.enabled = true;
                console.log('✅ Redis connected successfully');
            })
                .catch((error) => {
                console.warn('⚠️  Redis connection failed:', error.message);
                console.warn('⚠️  Operating without cache (graceful degradation)');
                this.enabled = false;
                this.redis = null;
            });
            // Handle Redis errors
            this.redis.on('error', (error) => {
                console.error('❌ Redis error:', error.message);
                this.enabled = false;
            });
            // Handle Redis reconnection
            this.redis.on('connect', () => {
                this.enabled = true;
                console.log('✅ Redis reconnected');
            });
        }
        catch (error) {
            console.warn('⚠️  Failed to initialize Redis:', error.message);
            this.enabled = false;
            this.redis = null;
        }
    }
    /**
     * Check if cache is enabled and available
     */
    isEnabled() {
        return this.enabled && this.redis !== null;
    }
    /**
     * Get value from cache
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEnabled()) {
                return null;
            }
            try {
                const value = yield this.redis.get(key);
                if (!value) {
                    return null;
                }
                return JSON.parse(value);
            }
            catch (error) {
                console.error(`Error getting cache key ${key}:`, error.message);
                return null;
            }
        });
    }
    /**
     * Set value in cache with TTL
     */
    set(key, value, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEnabled()) {
                return false;
            }
            try {
                const serialized = JSON.stringify(value);
                const seconds = ttl || this.DEFAULT_TTL;
                yield this.redis.setex(key, seconds, serialized);
                return true;
            }
            catch (error) {
                console.error(`Error setting cache key ${key}:`, error.message);
                return false;
            }
        });
    }
    /**
     * Delete key from cache
     */
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEnabled()) {
                return false;
            }
            try {
                yield this.redis.del(key);
                return true;
            }
            catch (error) {
                console.error(`Error deleting cache key ${key}:`, error.message);
                return false;
            }
        });
    }
    /**
     * Delete multiple keys matching pattern
     */
    delPattern(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEnabled()) {
                return 0;
            }
            try {
                const keys = yield this.redis.keys(pattern);
                if (keys.length === 0) {
                    return 0;
                }
                yield this.redis.del(...keys);
                return keys.length;
            }
            catch (error) {
                console.error(`Error deleting cache pattern ${pattern}:`, error.message);
                return 0;
            }
        });
    }
    /**
     * Check if key exists
     */
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEnabled()) {
                return false;
            }
            try {
                const result = yield this.redis.exists(key);
                return result === 1;
            }
            catch (error) {
                console.error(`Error checking cache key ${key}:`, error.message);
                return false;
            }
        });
    }
    /**
     * Get remaining TTL for a key
     */
    ttl(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEnabled()) {
                return -2;
            }
            try {
                return yield this.redis.ttl(key);
            }
            catch (error) {
                console.error(`Error getting TTL for key ${key}:`, error.message);
                return -2;
            }
        });
    }
    /**
     * Clear all cache
     */
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEnabled()) {
                return false;
            }
            try {
                yield this.redis.flushdb();
                console.log('🗑️  Cache flushed');
                return true;
            }
            catch (error) {
                console.error('Error flushing cache:', error.message);
                return false;
            }
        });
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isEnabled()) {
                return {
                    enabled: false,
                    connected: false,
                    keyCount: 0
                };
            }
            try {
                const keyCount = yield this.redis.dbsize();
                const info = yield this.redis.info('memory');
                // Parse used memory from info string
                const usedMemoryMatch = info.match(/used_memory_human:(.+)/);
                const usedMemory = usedMemoryMatch ? usedMemoryMatch[1].trim() : 'unknown';
                return {
                    enabled: true,
                    connected: this.redis.status === 'ready',
                    keyCount,
                    usedMemory
                };
            }
            catch (error) {
                console.error('Error getting cache stats:', error.message);
                return {
                    enabled: true,
                    connected: false,
                    keyCount: 0
                };
            }
        });
    }
    /**
     * Wrap a function with caching
     * Automatically caches function result
     */
    wrap(key, fn, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            // Try to get from cache first
            const cached = yield this.get(key);
            if (cached !== null) {
                console.log(`📦 Cache hit: ${key}`);
                return cached;
            }
            console.log(`🔍 Cache miss: ${key}`);
            // Execute function and cache result
            const result = yield fn();
            yield this.set(key, result, ttl);
            return result;
        });
    }
    /**
     * Close Redis connection
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.redis) {
                yield this.redis.quit();
                console.log('👋 Redis disconnected');
            }
        });
    }
}
// Export singleton instance
exports.default = new CacheService();
/**
 * Cache Key Patterns
 * Standardized key naming for consistency
 */
exports.CacheKeys = {
    // Departments
    departments: {
        list: (businessId) => `departments:list:${businessId}`,
        detail: (deptId) => `department:${deptId}`,
        all: () => 'departments:*'
    },
    // Businesses
    businesses: {
        list: () => 'businesses:list',
        detail: (businessId) => `business:${businessId}`,
        all: () => 'businesses:*'
    },
    // Staff
    staff: {
        list: (businessId, page, limit) => `staff:list:${businessId}:${page}:${limit}`,
        detail: (staffId) => `staff:${staffId}`,
        permissions: (staffId) => `staff:permissions:${staffId}`,
        all: () => 'staff:*'
    },
    // Reports (short TTL - 1 minute)
    reports: {
        locationCompliance: (businessId, startDate, endDate) => `report:location:${businessId}:${startDate}:${endDate}`,
        attendanceAnomalies: (businessId, startDate, endDate) => `report:anomalies:${businessId}:${startDate}:${endDate}`,
        lateCheckins: (businessId, startDate, endDate) => `report:late:${businessId}:${startDate}:${endDate}`,
        alertSummary: (businessId, startDate, endDate) => `report:alerts:${businessId}:${startDate}:${endDate}`,
        dashboard: (businessId, startDate, endDate) => `report:dashboard:${businessId}:${startDate}:${endDate}`,
        all: () => 'report:*'
    },
    // Alerts
    alerts: {
        list: (businessId, status) => status ? `alerts:${businessId}:${status}` : `alerts:${businessId}:all`,
        stats: (businessId) => `alerts:stats:${businessId}`,
        all: () => 'alerts:*'
    },
    // Activities
    activities: {
        list: (staffId, page) => `activities:${staffId}:${page}`,
        ongoing: (staffId) => `activities:ongoing:${staffId}`,
        all: () => 'activities:*'
    }
};
/**
 * Cache TTL Configuration (in seconds)
 */
exports.CacheTTL = {
    SHORT: 60, // 1 minute - for frequently changing data
    MEDIUM: 300, // 5 minutes - default
    LONG: 1800, // 30 minutes - for relatively static data
    VERY_LONG: 86400 // 24 hours - for rarely changing data
};
