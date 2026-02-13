"use strict";
/**
 * API Key Controller
 * Manages API key creation, listing, and revocation
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
exports.ApiKeyController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ApiKey_1 = require("../../../models/ApiKey");
const AuditService_1 = __importDefault(require("../../audit/services/AuditService"));
class ApiKeyController {
    constructor() {
        /**
         * Create new API key
         * POST /api/api-keys
         */
        this.createApiKey = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, businessId, permissions, expiresInDays } = req.body;
                const user = req.user;
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
                const invalidPermissions = (permissions || []).filter((p) => !validPermissions.includes(p));
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
                let expiresAt;
                if (expiresInDays && expiresInDays > 0) {
                    expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
                }
                // Create API key record
                const apiKey = yield ApiKey_1.ApiKey.create({
                    key,
                    name,
                    business: businessId,
                    permissions: permissions || [],
                    active: true,
                    expiresAt,
                    createdBy: user._id
                });
                // Log to audit
                yield this.auditService.createAuditLog({
                    action: 'API_KEY_CREATED',
                    performedBy: user._id.toString(),
                    targetModel: 'ApiKey',
                    targetId: apiKey._id.toString(),
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
            }
            catch (error) {
                console.error('Create API key error:', error);
                res.status(500).json({
                    error: 'Failed to create API key',
                    message: error.message
                });
            }
        });
        /**
         * List API keys for a business
         * GET /api/api-keys
         */
        this.listApiKeys = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId, active } = req.query;
                const user = req.user;
                if (!user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const query = {};
                if (businessId) {
                    query.business = businessId;
                }
                if (active !== undefined) {
                    query.active = active === 'true';
                }
                const apiKeys = yield ApiKey_1.ApiKey.find(query)
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
            }
            catch (error) {
                console.error('List API keys error:', error);
                res.status(500).json({
                    error: 'Failed to list API keys',
                    message: error.message
                });
            }
        });
        /**
         * Get single API key details
         * GET /api/api-keys/:id
         */
        this.getApiKey = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                if (!user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const apiKey = yield ApiKey_1.ApiKey.findById(id)
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
            }
            catch (error) {
                console.error('Get API key error:', error);
                res.status(500).json({
                    error: 'Failed to get API key',
                    message: error.message
                });
            }
        });
        /**
         * Revoke API key
         * DELETE /api/api-keys/:id
         */
        this.revokeApiKey = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                if (!user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const apiKey = yield ApiKey_1.ApiKey.findById(id);
                if (!apiKey) {
                    res.status(404).json({ error: 'API key not found' });
                    return;
                }
                // Mark as inactive instead of deleting
                apiKey.active = false;
                yield apiKey.save();
                // Log to audit
                yield this.auditService.createAuditLog({
                    action: 'API_KEY_REVOKED',
                    performedBy: user._id.toString(),
                    targetModel: 'ApiKey',
                    targetId: apiKey._id.toString(),
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
            }
            catch (error) {
                console.error('Revoke API key error:', error);
                res.status(500).json({
                    error: 'Failed to revoke API key',
                    message: error.message
                });
            }
        });
        /**
         * Update API key permissions
         * PUT /api/api-keys/:id
         */
        this.updateApiKey = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { name, permissions, active } = req.body;
                const user = req.user;
                if (!user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const apiKey = yield ApiKey_1.ApiKey.findById(id);
                if (!apiKey) {
                    res.status(404).json({ error: 'API key not found' });
                    return;
                }
                // Update fields
                if (name)
                    apiKey.name = name;
                if (permissions)
                    apiKey.permissions = permissions;
                if (active !== undefined)
                    apiKey.active = active;
                yield apiKey.save();
                // Log to audit
                yield this.auditService.createAuditLog({
                    action: 'API_KEY_UPDATED',
                    performedBy: user._id.toString(),
                    targetModel: 'ApiKey',
                    targetId: apiKey._id.toString(),
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
            }
            catch (error) {
                console.error('Update API key error:', error);
                res.status(500).json({
                    error: 'Failed to update API key',
                    message: error.message
                });
            }
        });
        this.auditService = new AuditService_1.default();
    }
    /**
     * Generate secure API key
     */
    generateApiKey() {
        // Generate a secure random key
        const randomBytes = crypto_1.default.randomBytes(32);
        return `hrms_${randomBytes.toString('base64url')}`;
    }
}
exports.ApiKeyController = ApiKeyController;
