/**
 * API Key Controller
 * Manages API key creation, listing, and revocation
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { ApiKey } from '../../../models/ApiKey';
import AuditService from '../../audit/services/AuditService';

export class ApiKeyController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Generate secure API key
   */
  private generateApiKey(): string {
    // Generate a secure random key
    const randomBytes = crypto.randomBytes(32);
    return `hrms_${randomBytes.toString('base64url')}`;
  }

  /**
   * Create new API key
   * POST /api/api-keys
   */
  createApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, businessId, permissions, expiresInDays } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Validate required fields
      if (!name || !businessId) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'name and businessId are required'
        });
        return;
      }

      // Validate permissions
      const validPermissions = [
        'read:staff',
        'write:staff',
        'read:attendance',
        'write:attendance',
        'read:reports',
        'read:alerts',
        'write:alerts',
        'read:activities',
        'write:activities',
        'admin:all'
      ];

      const invalidPermissions = (permissions || []).filter(
        (p: string) => !validPermissions.includes(p)
      );

      if (invalidPermissions.length > 0) {
        res.status(400).json({
          error: 'Invalid permissions',
          message: `Invalid permissions: ${invalidPermissions.join(', ')}`
        });
        return;
      }

      // Generate API key
      const key = this.generateApiKey();

      // Calculate expiry date
      let expiresAt: Date | undefined;
      if (expiresInDays && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      // Create API key record
      const apiKey = await ApiKey.create({
        key,
        name,
        business: businessId,
        permissions: permissions || [],
        active: true,
        expiresAt,
        createdBy: user._id
      });

      // Log to audit
      await this.auditService.createAuditLog({
        action: 'API_KEY_CREATED',
        performedBy: user._id.toString(),
        targetModel: 'ApiKey',
        targetId: (apiKey._id as any).toString(),
        business: businessId,
        metadata: {
          name,
          permissions,
          expiresAt
        }
      });

      res.status(201).json({
        success: true,
        apiKey: {
          id: apiKey._id,
          key: key, // Only shown once at creation
          name: apiKey.name,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          message: 'Save this key securely - it will not be shown again'
        }
      });
    } catch (error: any) {
      console.error('Create API key error:', error);
      res.status(500).json({
        error: 'Failed to create API key',
        message: error.message
      });
    }
  };

  /**
   * List API keys for a business
   * GET /api/api-keys
   */
  listApiKeys = async (req: Request, res: Response): Promise<void> => {
    try {
      const { businessId, active } = req.query;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const query: any = {};

      if (businessId) {
        query.business = businessId;
      }

      if (active !== undefined) {
        query.active = active === 'true';
      }

      const apiKeys = await ApiKey.find(query)
        .select('-key') // Never return the actual key
        .populate('business', 'name')
        .populate('createdBy', 'email name')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        apiKeys: apiKeys.map(key => ({
          id: key._id,
          name: key.name,
          business: key.business,
          permissions: key.permissions,
          active: key.active,
          expiresAt: key.expiresAt,
          lastUsed: key.lastUsed,
          createdBy: key.createdBy,
          createdAt: key.createdAt,
          isExpired: key.isExpired()
        }))
      });
    } catch (error: any) {
      console.error('List API keys error:', error);
      res.status(500).json({
        error: 'Failed to list API keys',
        message: error.message
      });
    }
  };

  /**
   * Get single API key details
   * GET /api/api-keys/:id
   */
  getApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const apiKey = await ApiKey.findById(id)
        .select('-key')
        .populate('business', 'name')
        .populate('createdBy', 'email name');

      if (!apiKey) {
        res.status(404).json({ error: 'API key not found' });
        return;
      }

      res.json({
        success: true,
        apiKey: {
          id: apiKey._id,
          name: apiKey.name,
          business: apiKey.business,
          permissions: apiKey.permissions,
          active: apiKey.active,
          expiresAt: apiKey.expiresAt,
          lastUsed: apiKey.lastUsed,
          createdBy: apiKey.createdBy,
          createdAt: apiKey.createdAt,
          isExpired: apiKey.isExpired()
        }
      });
    } catch (error: any) {
      console.error('Get API key error:', error);
      res.status(500).json({
        error: 'Failed to get API key',
        message: error.message
      });
    }
  };

  /**
   * Revoke API key
   * DELETE /api/api-keys/:id
   */
  revokeApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const apiKey = await ApiKey.findById(id);

      if (!apiKey) {
        res.status(404).json({ error: 'API key not found' });
        return;
      }

      // Mark as inactive instead of deleting
      apiKey.active = false;
      await apiKey.save();

      // Log to audit
      await this.auditService.createAuditLog({
        action: 'API_KEY_REVOKED',
        performedBy: user._id.toString(),
        targetModel: 'ApiKey',
        targetId: (apiKey._id as any).toString(),
        business: apiKey.business.toString(),
        metadata: {
          name: apiKey.name,
          revokedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'API key revoked successfully'
      });
    } catch (error: any) {
      console.error('Revoke API key error:', error);
      res.status(500).json({
        error: 'Failed to revoke API key',
        message: error.message
      });
    }
  };

  /**
   * Update API key permissions
   * PUT /api/api-keys/:id
   */
  updateApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, permissions, active } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const apiKey = await ApiKey.findById(id);

      if (!apiKey) {
        res.status(404).json({ error: 'API key not found' });
        return;
      }

      // Update fields
      if (name) apiKey.name = name;
      if (permissions) apiKey.permissions = permissions;
      if (active !== undefined) apiKey.active = active;

      await apiKey.save();

      // Log to audit
      await this.auditService.createAuditLog({
        action: 'API_KEY_UPDATED',
        performedBy: user._id.toString(),
        targetModel: 'ApiKey',
        targetId: (apiKey._id as any).toString(),
        business: apiKey.business.toString(),
        metadata: {
          name: apiKey.name,
          permissions: apiKey.permissions,
          active: apiKey.active
        }
      });

      res.json({
        success: true,
        message: 'API key updated successfully',
        apiKey: {
          id: apiKey._id,
          name: apiKey.name,
          permissions: apiKey.permissions,
          active: apiKey.active
        }
      });
    } catch (error: any) {
      console.error('Update API key error:', error);
      res.status(500).json({
        error: 'Failed to update API key',
        message: error.message
      });
    }
  };
}
