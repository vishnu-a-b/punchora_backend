/**
 * IP Whitelist Middleware
 * Restricts access to whitelisted IP addresses
 */

import { Request, Response, NextFunction } from 'express';
import AuditService from '../modules/audit/services/AuditService';

// IP whitelist - should be configured via environment variables
const getWhitelistedIPs = (): string[] => {
  const ipString = process.env.IP_WHITELIST || '';
  if (!ipString) return [];

  return ipString.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
};

// CIDR range checking helper
const isIPInRange = (ip: string, range: string): boolean => {
  // Simple implementation - for production, use a library like 'ipaddr.js'
  if (!range.includes('/')) {
    return ip === range;
  }

  // Basic CIDR matching (simplified - for production use proper library)
  const [rangeIP, bits] = range.split('/');
  const ipParts = ip.split('.').map(Number);
  const rangeParts = rangeIP.split('.').map(Number);
  const maskBits = parseInt(bits);

  // Convert to 32-bit integers
  const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
  const rangeInt = (rangeParts[0] << 24) + (rangeParts[1] << 16) + (rangeParts[2] << 8) + rangeParts[3];
  const mask = ~((1 << (32 - maskBits)) - 1);

  return (ipInt & mask) === (rangeInt & mask);
};

/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 */
const getClientIP = (req: Request): string => {
  // Check X-Forwarded-For header (most common with proxies)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = (xForwardedFor as string).split(',');
    return ips[0].trim();
  }

  // Check X-Real-IP header
  const xRealIP = req.headers['x-real-ip'];
  if (xRealIP) {
    return xRealIP as string;
  }

  // Fall back to socket IP
  return req.socket.remoteAddress || req.ip || 'unknown';
};

/**
 * Check if user is super admin (bypass IP whitelist)
 */
const isSuperAdmin = (req: Request): boolean => {
  const user = (req as any).user;
  return user && (user.role === 'super_admin' || user.isSuperAdmin === true);
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip if IP whitelist is disabled
    if (process.env.ENABLE_IP_WHITELIST !== 'true') {
      return next();
    }

    const clientIP = getClientIP(req);
    const whitelistedIPs = getWhitelistedIPs();

    // If no whitelist configured, allow all
    if (whitelistedIPs.length === 0) {
      return next();
    }

    // Super admins bypass IP whitelist
    if (isSuperAdmin(req)) {
      return next();
    }

    // Check if IP is whitelisted
    const isWhitelisted = whitelistedIPs.some(range => isIPInRange(clientIP, range));

    if (!isWhitelisted) {
      // Log blocked attempt to audit
      try {
        const auditService = new AuditService();
        const user = (req as any).user;

        await auditService.createAuditLog({
          action: 'IP_BLOCKED',
          performedBy: user?._id?.toString() || 'anonymous',
          targetModel: 'Security',
          targetId: 'ip-whitelist',
          metadata: {
            blockedIP: clientIP,
            endpoint: req.path,
            method: req.method,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (auditError) {
        console.error('Failed to log IP block:', auditError);
      }

      res.status(403).json({
        error: 'Access forbidden',
        message: 'Your IP address is not authorized to access this resource'
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error('IP whitelist error:', error);
    // On error, fail securely by denying access
    res.status(500).json({
      error: 'Security check failed',
      message: 'Failed to validate IP address'
    });
  }
};

/**
 * Strict IP whitelist for sensitive endpoints
 * Does not allow super admin bypass
 */
export const strictIpWhitelist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clientIP = getClientIP(req);
    const whitelistedIPs = getWhitelistedIPs();

    // Require whitelist configuration for strict mode
    if (whitelistedIPs.length === 0) {
      res.status(403).json({
        error: 'Access forbidden',
        message: 'IP whitelist not configured for this endpoint'
      });
      return;
    }

    const isWhitelisted = whitelistedIPs.some(range => isIPInRange(clientIP, range));

    if (!isWhitelisted) {
      res.status(403).json({
        error: 'Access forbidden',
        message: 'Your IP address is not authorized'
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error('Strict IP whitelist error:', error);
    res.status(500).json({
      error: 'Security check failed',
      message: 'Failed to validate IP address'
    });
  }
};

export { getClientIP };
