/**
 * CSRF Protection Middleware
 * Uses double-submit cookie pattern for CSRF protection
 */

import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';

// Initialize CSRF protection
const {
  generateCsrfToken: generateToken,
  doubleCsrfProtection,
  invalidCsrfTokenError
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  getSessionIdentifier: (req: Request) => (req as any).session?.id || (req as any).user?._id?.toString() || 'anonymous',
  cookieName: '__Host-csrf',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req: Request) => {
    // Check multiple sources for CSRF token
    return req.headers['x-csrf-token'] as string ||
           req.body?._csrf ||
           req.query?._csrf as string;
  }
});

/**
 * CSRF token generation endpoint handler
 */
export const generateCsrfToken = (req: Request, res: Response) => {
  try {
    const token = generateToken(req, res);
    res.json({ csrfToken: token });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate CSRF token', message: error.message });
  }
};

/**
 * Custom CSRF protection middleware with error handling
 * CURRENTLY DISABLED - All requests bypass CSRF protection
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // CSRF PROTECTION DISABLED
  // To re-enable, set ENABLE_CSRF=true in .env
  if (process.env.ENABLE_CSRF !== 'true') {
    return next();
  }

  // ALWAYS skip CSRF for safe methods (GET, HEAD, OPTIONS)
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for authentication endpoints (login, register, refresh)
  const authExemptPaths = [
    '/auth/jwt/create',
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/security/csrf-token',
    '/v1/auth',  // All auth endpoints
  ];

  if (authExemptPaths.some(path => req.path.includes(path))) {
    return next();
  }

  // Skip CSRF for mobile app endpoints (use API keys instead)
  if (req.path.startsWith('/api/mobile') || req.path.startsWith('/api/offline')) {
    return next();
  }

  // Skip CSRF if API key is present
  if (req.headers['x-api-key']) {
    return next();
  }

  // Apply CSRF protection
  try {
    doubleCsrfProtection(req, res, (error?: any) => {
      if (error) {
        if (error === invalidCsrfTokenError) {
          return res.status(403).json({
            error: 'CSRF token validation failed',
            message: 'Invalid or missing CSRF token'
          });
        }
        return res.status(500).json({
          error: 'CSRF protection error',
          message: error.message || String(error)
        });
      }
      next();
    });
  } catch (error: any) {
    // Handle synchronous errors
    console.error('[CSRF] Error:', error.message);
    return res.status(500).json({
      error: 'CSRF protection error',
      message: error.message
    });
  }
};

export { generateToken, doubleCsrfProtection };
