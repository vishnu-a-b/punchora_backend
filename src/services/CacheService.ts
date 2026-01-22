/**
 * Cache Service
 * Phase 6 Day 1: Redis caching layer for performance optimization
 */

import Redis from 'ioredis';

/**
 * Cache Service with Redis
 * Provides caching with automatic graceful degradation if Redis is unavailable
 */
class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  private initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redis = new Redis(redisUrl, {
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

    } catch (error: any) {
      console.warn('⚠️  Failed to initialize Redis:', error.message);
      this.enabled = false;
      this.redis = null;
    }
  }

  /**
   * Check if cache is enabled and available
   */
  isEnabled(): boolean {
    return this.enabled && this.redis !== null;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const value = await this.redis!.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error: any) {
      console.error(`Error getting cache key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const seconds = ttl || this.DEFAULT_TTL;

      await this.redis!.setex(key, seconds, serialized);
      return true;
    } catch (error: any) {
      console.error(`Error setting cache key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      await this.redis!.del(key);
      return true;
    } catch (error: any) {
      console.error(`Error deleting cache key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isEnabled()) {
      return 0;
    }

    try {
      const keys = await this.redis!.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.redis!.del(...keys);
      return keys.length;
    } catch (error: any) {
      console.error(`Error deleting cache pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error: any) {
      console.error(`Error checking cache key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isEnabled()) {
      return -2;
    }

    try {
      return await this.redis!.ttl(key);
    } catch (error: any) {
      console.error(`Error getting TTL for key ${key}:`, error.message);
      return -2;
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      await this.redis!.flushdb();
      console.log('🗑️  Cache flushed');
      return true;
    } catch (error: any) {
      console.error('Error flushing cache:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    enabled: boolean;
    connected: boolean;
    keyCount: number;
    usedMemory?: string;
  }> {
    if (!this.isEnabled()) {
      return {
        enabled: false,
        connected: false,
        keyCount: 0
      };
    }

    try {
      const keyCount = await this.redis!.dbsize();
      const info = await this.redis!.info('memory');

      // Parse used memory from info string
      const usedMemoryMatch = info.match(/used_memory_human:(.+)/);
      const usedMemory = usedMemoryMatch ? usedMemoryMatch[1].trim() : 'unknown';

      return {
        enabled: true,
        connected: this.redis!.status === 'ready',
        keyCount,
        usedMemory
      };
    } catch (error: any) {
      console.error('Error getting cache stats:', error.message);
      return {
        enabled: true,
        connected: false,
        keyCount: 0
      };
    }
  }

  /**
   * Wrap a function with caching
   * Automatically caches function result
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);

    if (cached !== null) {
      console.log(`📦 Cache hit: ${key}`);
      return cached;
    }

    console.log(`🔍 Cache miss: ${key}`);

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);

    return result;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      console.log('👋 Redis disconnected');
    }
  }
}

// Export singleton instance
export default new CacheService();

/**
 * Cache Key Patterns
 * Standardized key naming for consistency
 */
export const CacheKeys = {
  // Departments
  departments: {
    list: (businessId: string) => `departments:list:${businessId}`,
    detail: (deptId: string) => `department:${deptId}`,
    all: () => 'departments:*'
  },

  // Businesses
  businesses: {
    list: () => 'businesses:list',
    detail: (businessId: string) => `business:${businessId}`,
    all: () => 'businesses:*'
  },

  // Staff
  staff: {
    list: (businessId: string, page: number, limit: number) =>
      `staff:list:${businessId}:${page}:${limit}`,
    detail: (staffId: string) => `staff:${staffId}`,
    permissions: (staffId: string) => `staff:permissions:${staffId}`,
    all: () => 'staff:*'
  },

  // Reports (short TTL - 1 minute)
  reports: {
    locationCompliance: (businessId: string, startDate: string, endDate: string) =>
      `report:location:${businessId}:${startDate}:${endDate}`,
    attendanceAnomalies: (businessId: string, startDate: string, endDate: string) =>
      `report:anomalies:${businessId}:${startDate}:${endDate}`,
    lateCheckins: (businessId: string, startDate: string, endDate: string) =>
      `report:late:${businessId}:${startDate}:${endDate}`,
    alertSummary: (businessId: string, startDate: string, endDate: string) =>
      `report:alerts:${businessId}:${startDate}:${endDate}`,
    dashboard: (businessId: string, startDate: string, endDate: string) =>
      `report:dashboard:${businessId}:${startDate}:${endDate}`,
    all: () => 'report:*'
  },

  // Alerts
  alerts: {
    list: (businessId: string, status?: string) =>
      status ? `alerts:${businessId}:${status}` : `alerts:${businessId}:all`,
    stats: (businessId: string) => `alerts:stats:${businessId}`,
    all: () => 'alerts:*'
  },

  // Activities
  activities: {
    list: (staffId: string, page: number) => `activities:${staffId}:${page}`,
    ongoing: (staffId: string) => `activities:ongoing:${staffId}`,
    all: () => 'activities:*'
  }
};

/**
 * Cache TTL Configuration (in seconds)
 */
export const CacheTTL = {
  SHORT: 60,           // 1 minute - for frequently changing data
  MEDIUM: 300,         // 5 minutes - default
  LONG: 1800,          // 30 minutes - for relatively static data
  VERY_LONG: 86400     // 24 hours - for rarely changing data
};
