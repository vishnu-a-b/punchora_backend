/**
 * Cache Middleware
 * Phase 6 Day 1: Automatic response caching
 */

import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/CacheService';

/**
 * Cache Response Middleware
 * Caches GET requests automatically
 */
export function cacheMiddleware(ttl?: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if cache is disabled
    if (!cacheService.isEnabled()) {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = generateCacheKey(req);

    try {
      // Try to get cached response
      const cachedResponse = await cacheService.get<any>(cacheKey);

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

      res.json = function (body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl).catch((error) => {
            console.error('Error caching response:', error.message);
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error: any) {
      console.error('Cache middleware error:', error.message);
      // Continue without cache on error
      next();
    }
  };
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request): string {
  const user = (req as any).user;
  const userId = user?._id?.toString() || 'anonymous';

  // Include URL path and query params
  const path = req.path;
  const query = JSON.stringify(req.query);

  return `api:${userId}:${path}:${query}`;
}

/**
 * Cache Invalidation Middleware
 * Automatically invalidates related caches on POST/PUT/DELETE
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on mutation methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Store original send function
      const originalSend = res.send.bind(res);

      res.send = function (body: any) {
        // Invalidate cache patterns after successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
          Promise.all(
            patterns.map(pattern => cacheService.delPattern(pattern))
          ).then(results => {
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
  };
}

/**
 * Conditional Cache Middleware
 * Only caches if a condition is met
 */
export function conditionalCacheMiddleware(
  condition: (req: Request) => boolean,
  ttl?: number
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return cacheMiddleware(ttl)(req, res, next);
    }

    next();
  };
}

/**
 * User-specific Cache Middleware
 * Caches responses per user
 */
export function userCacheMiddleware(ttl?: number) {
  return cacheMiddleware(ttl);
}

/**
 * Business-scoped Cache Middleware
 * Caches responses per business
 */
export function businessCacheMiddleware(ttl?: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if cache is disabled
    if (!cacheService.isEnabled()) {
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
      const cachedResponse = await cacheService.get<any>(cacheKey);

      if (cachedResponse) {
        console.log(`📦 Business cache hit: ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedResponse);
      }

      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);

      res.json = function (body: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl).catch((error) => {
            console.error('Error caching response:', error.message);
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error: any) {
      console.error('Business cache middleware error:', error.message);
      next();
    }
  };
}

/**
 * Cache Control Headers Middleware
 * Sets appropriate cache-control headers
 */
export function cacheControlMiddleware(maxAge: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    }

    next();
  };
}
