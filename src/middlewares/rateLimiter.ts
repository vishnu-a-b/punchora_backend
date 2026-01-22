/**
 * Rate Limiting Middleware
 * Phase 5 Day 10: Protect API endpoints from abuse
 */

import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * Applies to all API routes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for specific conditions
  skip: (req) => {
    // Skip for health check endpoint
    return req.path === '/health';
  }
});

/**
 * Authentication Rate Limiter
 * Strict limit for login/registration endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again after 15 minutes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Offline Sync Rate Limiter
 * Moderate limit for bulk sync operations
 */
export const offlineSyncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 sync requests per 5 minutes
  message: {
    error: 'Too many sync requests, please try again later',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Allow larger window for authenticated users
  keyGenerator: (req: any) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  }
});

/**
 * Report Generation Rate Limiter
 * Limit expensive report generation requests
 */
export const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Limit each user to 30 report requests per 10 minutes
  message: {
    error: 'Too many report requests, please try again later',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  }
});

/**
 * File Upload Rate Limiter
 * Strict limit for file upload endpoints
 */
export const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 file uploads per 15 minutes
  message: {
    error: 'Too many file uploads, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Password Reset Rate Limiter
 * Very strict limit for password reset requests
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts, please try again after 1 hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Alert Creation Rate Limiter
 * Prevent alert spam
 */
export const alertLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit to 100 alert operations per 5 minutes
  message: {
    error: 'Too many alert requests, please try again later',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Export Rate Limiter
 * Limit expensive export operations
 */
export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 exports per 15 minutes
  message: {
    error: 'Too many export requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Face Recognition Rate Limiter
 * Limit computationally expensive face recognition requests
 */
export const faceRecognitionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit to 100 face recognition requests per 5 minutes
  message: {
    error: 'Too many face recognition requests, please try again later',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Rate Limiter Configuration Summary
 *
 * Endpoint Type              | Window    | Max Requests | Use Case
 * ---------------------------|-----------|--------------|------------------
 * General API                | 15 min    | 100          | All API routes
 * Authentication             | 15 min    | 5            | Login/Register
 * Offline Sync               | 5 min     | 20           | Bulk sync operations
 * Report Generation          | 10 min    | 30           | Report endpoints
 * File Upload                | 15 min    | 50           | File uploads
 * Password Reset             | 1 hour    | 3            | Password reset
 * Alerts                     | 5 min     | 100          | Alert operations
 * Export                     | 15 min    | 10           | PDF/CSV/JSON exports
 * Face Recognition           | 5 min     | 100          | Face detection/matching
 */
