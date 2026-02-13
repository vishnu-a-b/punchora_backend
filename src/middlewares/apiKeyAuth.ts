/**
 * API Key Authentication Middleware
 * Validates API keys for programmatic access
 */

import { Request, Response, NextFunction } from 'express';
import { ApiKey, IApiKey } from '../models/ApiKey';
import AuditService from '../modules/audit/services/AuditService';

// Extend Express Request to include apiKey
declare global {
  namespace Express {
    interface Request {
      apiKey?: IApiKey;
    }
  }
}

/**
 * Middleware to validate API key from request header
 */
export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKeyValue = req.headers['x-api-key'] as string;

    if (!apiKeyValue) {
      // No API key provided, continue to next middleware (might use JWT auth)
      return next();
    }

    // Find API key in database
    const apiKey = await ApiKey.findOne({
      key: apiKeyValue,
      active: true
    }).populate('business');

    if (!apiKey) {
      res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or has been revoked'
      });
      return;
    }

    // Check if expired
    if (apiKey.isExpired()) {
      res.status(401).json({
        error: 'API key expired',
        message: 'The provided API key has expired'
      });
      return;
    }

    // Update last used timestamp (async, don't wait)
    ApiKey.updateOne(
      { _id: apiKey._id },
      { $set: { lastUsed: new Date() } }
    ).exec().catch(err => console.error('Failed to update API key lastUsed:', err));

    // Log API key usage to audit trail
    try {
      const auditService = new AuditService();
      await auditService.createAuditLog({
        action: 'API_KEY_USED',
        performedBy: apiKey.createdBy.toString(),
        targetModel: 'ApiKey',
        targetId: (apiKey._id as any).toString(),
        business: apiKey.business._id.toString(),
        metadata: {
          apiKeyName: apiKey.name,
          endpoint: req.path,
          method: req.method
        }
      });
    } catch (auditError) {
      console.error('Failed to log API key usage:', auditError);
    }

    // Attach API key to request for downstream use
    req.apiKey = apiKey;

    next();
  } catch (error: any) {
    console.error('API key validation error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to validate API key'
    });
  }
};

/**
 * Middleware to require API key for specific routes
 */
export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.apiKey) {
    res.status(401).json({
      error: 'API key required',
      message: 'This endpoint requires a valid API key'
    });
    return;
  }
  next();
};

/**
 * Middleware to check if API key has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({
        error: 'API key required',
        message: 'This endpoint requires a valid API key'
      });
      return;
    }

    if (!req.apiKey.hasPermission(permission)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `This API key does not have the required permission: ${permission}`
      });
      return;
    }

    next();
  };
};
